from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import List, Optional
import pandas as pd
import random
import re
import io
from fastapi.responses import StreamingResponse
from models import UserCreate
from routes.auth import get_current_admin_user, get_password_hash, verify_password
from database import get_database
from routes.shared import update_expired_job_statuses

router = APIRouter(prefix="/admin", tags=["Admin"])

ALLOWED_JOB_STATUSES = ["open", "closed", "submitted", "demand closed"]
MANUAL_JOB_STATUSES = ["open", "closed", "submitted"]

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Check file extension
    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(status_code=400, detail="Only CSV (.csv) and Excel (.xlsx, .xls) files are allowed")
    
    try:
        # Read file based on extension
        if file_extension == 'csv':
            df = pd.read_csv(file.file)
        else:  # Excel files
            df = pd.read_excel(file.file, engine='openpyxl')
        
        # Validate required columns with flexible naming
        required_columns = ['title', 'description', 'location', 'csa_id', 'start_date', 'end_date']
        column_mapping = {
            'title': ['title', 'job title', 'job_title'],
            'description': ['description', 'job description', 'job_description'],
            'location': ['location'],
            'csa_id': ['csa_id', 'csa id', 'csaid'],
            'start_date': ['start_date', 'start date', 'startdate'],
            'end_date': ['end_date', 'end date', 'enddate']
        }
        
        # Map actual columns to required columns
        actual_columns = [col.lower().strip() for col in df.columns]
        mapped_columns = {}
        missing_columns = []
        
        for required_col, possible_names in column_mapping.items():
            found = False
            for possible_name in possible_names:
                if possible_name in actual_columns:
                    mapped_columns[required_col] = df.columns[actual_columns.index(possible_name)]
                    found = True
                    break
            if not found:
                missing_columns.append(required_col)
        
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_columns}")
        
        jobs_added = 0
        for _, row in df.iterrows():
            # Generate unique job ID
            job_id = f"jb{datetime.now().strftime('%m%d%H%M')}{random.randint(10, 99)}"
            
            # Parse dates from file
            start_date_str = str(row[mapped_columns['start_date']]) if pd.notna(row[mapped_columns['start_date']]) else None
            end_date_str = str(row[mapped_columns['end_date']]) if pd.notna(row[mapped_columns['end_date']]) else None
            
            try:
                start_date = pd.to_datetime(start_date_str).replace(tzinfo=timezone.utc) if start_date_str else datetime.now(timezone.utc)
                end_date = pd.to_datetime(end_date_str).replace(tzinfo=timezone.utc) if end_date_str else datetime.now(timezone.utc)
            except:
                start_date = datetime.now(timezone.utc)
                end_date = datetime.now(timezone.utc)
            
            # Clean and validate CSA ID
            csa_id = str(row[mapped_columns['csa_id']]).strip() if pd.notna(row[mapped_columns['csa_id']]) else ""
            
            job_data = {
                "job_id": job_id,
                "title": str(row[mapped_columns['title']]).strip() if pd.notna(row[mapped_columns['title']]) else "",
                "description": str(row[mapped_columns['description']]).strip() if pd.notna(row[mapped_columns['description']]) else "",
                "location": str(row[mapped_columns['location']]).strip() if pd.notna(row[mapped_columns['location']]) else "",
                "csa_id": csa_id,
                "start_date": start_date,
                "end_date": end_date,
                "salary_package": "",  # No longer required in new format
                "source_company": f"{file_extension.upper()} Upload",
                "uploaded_by": str(current_user["_id"]),
                "status": "open",
                "created_at": datetime.now(timezone.utc)
            }
            
            result = await db.recruitment_portal.jobs.insert_one(job_data)
            jobs_added += 1
        
        return {"message": f"Successfully uploaded {jobs_added} jobs from {file_extension.upper()} file"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing {file_extension.upper()} file: {str(e)}")

@router.post("/add-job")
async def add_job(job_data: dict, current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Generate unique job ID
    job_id = f"jb{datetime.now().strftime('%m%d%H%M')}{random.randint(10, 99)}"
    
    job_data["job_id"] = job_id
    job_data["uploaded_by"] = str(current_user["_id"])
    # Only allow manual statuses
    status = job_data.get("status", "open")
    if status not in MANUAL_JOB_STATUSES:
        status = "open"
    job_data["status"] = status
    job_data["created_at"] = datetime.now(timezone.utc)
    job_data["source_company"] = "Manual Entry"
    
    # Set default dates if not provided
    if "start_date" not in job_data:
        job_data["start_date"] = datetime.now(timezone.utc)
    if "end_date" not in job_data:
        job_data["end_date"] = datetime.now(timezone.utc)
    
    result = await db.recruitment_portal.jobs.insert_one(job_data)
    
    return {"message": "Job added successfully", "job_id": job_id}

@router.post("/add-jobs-bulk")
async def add_jobs_bulk(jobs_data: List[dict], current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()

    added_count = 0
    skipped_rows = []

    # Preload HR users (for username lookup, case-insensitive)
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}, {"name": 1}).to_list(length=500)
    name_to_id = {u["name"].lower(): str(u["_id"]) for u in hr_users}

    # Track CSA IDs within batch to enforce uniqueness per request
    seen_csa_ids = set()

    # Load salary bands for band->rate lookup
    salary_bands = await db.recruitment_portal.salary_bands.find({}).to_list(length=100)
    band_map = {b["band"]: b for b in salary_bands}

    async def is_csa_unique(csa_id: str) -> bool:
        existing = await db.recruitment_portal.jobs.find_one({"csa_id": csa_id})
        return existing is None

    def compute_actual(band: str, rate: str) -> str:
        if not band or not rate:
            return ""
        band_doc = band_map.get(band)
        if not band_doc:
            return ""
        rate_key = rate.lower()
        if rate_key not in ("standard", "ra1", "ra2"):
            return ""
        rate_value = band_doc.get(rate_key)
        if rate_value is None:
            return ""
        return str(rate_value * 1920)

    def compute_expected(actual: str, profit: str) -> str:
        try:
            if not actual or not profit:
                return ""
            actual_f = float(actual)
            profit_f = float(profit)
            return str(actual_f - (actual_f * (profit_f / 100.0)))
        except Exception:
            return ""

    for index, raw in enumerate(jobs_data):
        reasons = []

        # Normalize fields per spec
        csa_id = str(raw.get("csa_id", "")).strip()
        title = str(raw.get("title", "")).strip()
        description = str(raw.get("description", "")).strip()
        location = str(raw.get("location", "")).strip() if raw.get("location") else ""
        band = str(raw.get("salary_band") or raw.get("band") or "").strip()
        rate = str(raw.get("salary_rate") or raw.get("rate") or "").strip().lower()
        profit_percentage = str(raw.get("profit_percentage") or "").strip()
        assigned_hr_username = str(raw.get("assigned_hr") or "").strip()
        start_date_raw = str(raw.get("start_date") or "").strip()
        end_date_raw = str(raw.get("end_date") or "").strip()
        priority = str(raw.get("priority") or "").strip()

        # Required field checks
        if not csa_id:
            reasons.append("csa_id is required")
        if not title:
            reasons.append("title is required")
        if not description:
            reasons.append("description is required")

        # Enforce rate values if present
        if rate and rate not in ("standard", "ra1", "ra2"):
            reasons.append("invalid rate; must be standard, ra1, or ra2")

        # CSA uniqueness in batch
        if csa_id:
            if csa_id in seen_csa_ids:
                reasons.append("duplicate csa_id in upload batch")
            else:
                # Check uniqueness in DB
                if not await is_csa_unique(csa_id):
                    reasons.append("csa_id already exists in database")
            
        # Resolve assigned HR by username (case-insensitive)
        assigned_hr_id = None
        if assigned_hr_username:
            assigned_hr_id = name_to_id.get(assigned_hr_username.lower())
            if not assigned_hr_id:
                reasons.append("assigned_hr username not found")

        # Compute actual and expected if possible
        salary_package = str(raw.get("actual_salary") or raw.get("salary_package") or "").strip()
        if not salary_package and band and rate:
            salary_package = compute_actual(band, rate)
        expected_package = str(raw.get("expected_package") or "").strip()
        if not expected_package and salary_package and profit_percentage:
            expected_package = compute_expected(salary_package, profit_percentage)

        # Parse dates if present (dd-mm-yyyy). If invalid, set empty
        def parse_dd_mm_yyyy(value: str):
            if not value:
                return ""
            try:
                # pandas not used here; manual parse
                parts = value.replace("/", "-").split("-")
                if len(parts) != 3:
                    return ""
                dd, mm, yyyy = parts[0].zfill(2), parts[1].zfill(2), parts[2]
                if len(yyyy) != 4:
                    return ""
                return f"{yyyy}-{mm}-{dd}"
            except Exception:
                return ""

        start_date = parse_dd_mm_yyyy(start_date_raw)
        end_date = parse_dd_mm_yyyy(end_date_raw)

        # Skip row if any reasons collected
        if reasons:
            skipped_rows.append({"row_index": index + 1, "reasons": reasons})
            continue

        # Build final job document
        job_id = f"jb{datetime.now().strftime('%m%d%H%M')}{random.randint(10, 99)}"
        job_doc = {
            "job_id": job_id,
            "title": title,
            "description": description,
            "location": location,
            "salary_band": band or None,
            "salary_rate": rate or None,
            "salary_package": salary_package or "",
            "profit_percentage": profit_percentage or None,
            "expected_package": expected_package or None,
            "csa_id": csa_id,
            "priority": priority or None,
            "uploaded_by": str(current_user["_id"]),
            "status": "open",
            "created_at": datetime.now(timezone.utc),
            "source_company": "File Upload"
        }

        if assigned_hr_id:
            job_doc["assigned_hr"] = assigned_hr_id

        # Store parsed dates (or empty if missing/invalid)
        job_doc["start_date"] = start_date
        job_doc["end_date"] = end_date

        await db.recruitment_portal.jobs.insert_one(job_doc)
        added_count += 1
        seen_csa_ids.add(csa_id)

    return {
        "added_count": added_count,
        "skipped_count": len(skipped_rows),
        "skipped_rows": skipped_rows
    }

@router.put("/jobs/{job_id}")
async def update_job(
    job_id: str,
    job_update: dict,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Remove fields that shouldn't be updated
    job_update.pop("_id", None)
    job_update.pop("job_id", None)
    job_update.pop("uploaded_by", None)
    job_update.pop("created_at", None)
    
    # Prevent manual setting of demand closed
    if "status" in job_update:
        if job_update["status"] not in MANUAL_JOB_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status. Allowed: open, closed, submitted.")
    
    result = await db.recruitment_portal.jobs.update_one(
        {"job_id": job_id},
        {"$set": job_update}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job updated successfully"}

@router.get("/jobs")
async def get_all_jobs(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    assigned_hr: Optional[str] = None,
    report_type: Optional[str] = None,
    search: Optional[str] = None,
    page: Optional[int] = 1,
    limit: Optional[int] = 25,
    current_user: dict = Depends(get_current_admin_user)
):
    # Validate pagination parameters
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 25
    
    db = await get_database()
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
    # Build filter
    filter_query = {}
    if status:
        filter_query["status"] = status
    if assigned_hr:
        filter_query["assigned_hr"] = assigned_hr
    
    # Handle search functionality
    if search:
        # Create a regex pattern for case-insensitive search
        import re
        search_pattern = re.compile(search, re.IGNORECASE)
        filter_query["$or"] = [
            {"title": search_pattern},
            {"description": search_pattern},
            {"job_id": search_pattern},
            {"csa_id": search_pattern},
            {"location": search_pattern},
            {"salary_package": search_pattern}
        ]
    
    # Handle date filtering
    if report_type:
        now = datetime.now(timezone.utc)
        if report_type == "weekly":
            # Last 7 days
            start_date_range = now - timedelta(days=7)
            filter_query["start_date"] = {
                "$gte": start_date_range,
                "$lte": now
            }
        elif report_type == "monthly":
            # Last 30 days
            start_date_range = now - timedelta(days=30)
            filter_query["start_date"] = {
                "$gte": start_date_range,
                "$lte": now
            }
    else:
        # Handle custom date range filtering
        if start_date and end_date:
            # Both dates provided - filter jobs with start_date between start and end (inclusive)
            # Since dates are stored as strings in the database, compare as strings
            filter_query["start_date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            # Only start date provided - filter jobs with start_date >= start_date
            filter_query["start_date"] = {"$gte": start_date}
        elif end_date:
            # Only end date provided - filter jobs with start_date <= end_date
            filter_query["start_date"] = {"$lte": end_date}

    # Get total count for pagination
    total_jobs = await db.recruitment_portal.jobs.count_documents(filter_query)
    
    # Calculate pagination
    total_pages = (total_jobs + limit - 1) // limit
    skip = (page - 1) * limit
    
    # Get all HR users for name mapping
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    hr_user_map = {str(user["_id"]): user["name"] for user in hr_users}
    
    # Get paginated jobs
    jobs = await db.recruitment_portal.jobs.find(filter_query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    for job in jobs:
        job["id"] = str(job["_id"])
        del job["_id"]
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in job and isinstance(job["created_at"], datetime):
            job["created_at"] = job["created_at"].isoformat()
        if "start_date" in job and isinstance(job["start_date"], datetime):
            job["start_date"] = job["start_date"].isoformat()
        if "end_date" in job and isinstance(job["end_date"], datetime):
            job["end_date"] = job["end_date"].isoformat()
        # Add HR user name if assigned
        if job.get("assigned_hr"):
            job["assigned_hr_name"] = hr_user_map.get(job["assigned_hr"], "Unknown")
    
    return {
        "jobs": jobs,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_jobs": total_jobs,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.put("/jobs/{job_id}/allocate")
async def allocate_job(
    job_id: str,
    hr_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Verify HR user exists
    hr_user = await db.recruitment_portal.users.find_one({"_id": ObjectId(hr_id), "role": "hr"})
    if not hr_user:
        raise HTTPException(status_code=404, detail="HR user not found")
    
    result = await db.recruitment_portal.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"assigned_hr": hr_id, "status": "allocated"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job allocated successfully"}

@router.get("/users")
async def get_all_users(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    
    for user in users:
        user["id"] = str(user["_id"])
        del user["_id"]
        del user["password"]  # Don't send password
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in user and isinstance(user["created_at"], datetime):
            user["created_at"] = user["created_at"].isoformat()
    
    return users

@router.post("/users")
async def create_hr_user(user_data: dict, current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.recruitment_portal.users.find_one({"email": user_data["email"]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new HR user
    from routes.auth import get_password_hash
    
    created_at = datetime.now(timezone.utc)
    user_data["role"] = "hr"
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["created_at"] = created_at
    
    result = await db.recruitment_portal.users.insert_one(user_data)
    
    # Create response data without ObjectId
    response_data = {
        "id": str(result.inserted_id),
        "name": user_data["name"],
        "email": user_data["email"],
        "role": user_data["role"],
        "created_at": created_at.isoformat()
    }
    
    return {"message": "HR user created successfully", "user": response_data}

@router.delete("/users/{user_id}")
async def delete_hr_user(user_id: str, current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Check if HR has allocated jobs
    allocated_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": user_id})
    if allocated_jobs > 0:
        raise HTTPException(status_code=400, detail="Cannot delete HR user with allocated jobs")
    
    result = await db.recruitment_portal.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "HR user deleted successfully"}

@router.put("/users/{user_id}")
async def update_hr_user(
    user_id: str,
    user_update: dict,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Remove fields that shouldn't be updated
    user_update.pop("_id", None)
    user_update.pop("role", None)
    user_update.pop("created_at", None)
    
    # Hash password if provided
    if "password" in user_update and user_update["password"]:
        from routes.auth import get_password_hash
        user_update["password"] = get_password_hash(user_update["password"])
    elif "password" in user_update:
        del user_update["password"]
    
    result = await db.recruitment_portal.users.update_one(
        {"_id": ObjectId(user_id), "role": "hr"},
        {"$set": user_update}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="HR user not found")
    
    return {"message": "HR user updated successfully"}

@router.get("/hr-users")
async def get_hr_users_for_filter(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    
    hr_list = []
    for user in hr_users:
        hr_list.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        })
    
    return hr_list

@router.get("/dashboard")
async def get_dashboard(
    report_type: Optional[str] = None,  # "weekly", "monthly", "custom"
    hr_id: Optional[str] = None,  # If None, generate report for all HR
    custom_start_date: Optional[str] = None,
    custom_end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Build date filter based on report type
    date_filter = {}
    if report_type:
        
        now = datetime.now(timezone.utc)
        
        if report_type == "weekly":
            # Last 7 days - convert to string format for comparison
            start_date = now - timedelta(days=7)
            date_filter = {
                "start_date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": now.strftime("%Y-%m-%d")
                }
            }
        elif report_type == "monthly":
            # Last 30 days - convert to string format for comparison
            start_date = now - timedelta(days=30)
            date_filter = {
                "start_date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": now.strftime("%Y-%m-%d")
                }
            }
        elif report_type == "custom" and custom_start_date and custom_end_date:
            # Custom date range - filter by start_date to match jobs filtering logic
            date_filter = {
                "start_date": {
                    "$gte": custom_start_date,
                    "$lte": custom_end_date
                }
            }
    
    # Build HR filter
    hr_filter = {}
    if hr_id:
        hr_filter["assigned_hr"] = hr_id
    
    # Combine filters
    job_filter = {**date_filter, **hr_filter}
    # For candidates, use created_by instead of assigned_hr
    candidate_filter = {**date_filter}
    if hr_id:
        candidate_filter["created_by"] = hr_id
    
    # Get job counts with filters
    total_jobs = await db.recruitment_portal.jobs.count_documents(job_filter)
    open_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "status": "open"})
    closed_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "status": "closed"})
    submitted_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "status": "submitted"})
    demand_closed_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "status": "demand closed"})
    
    # Get candidate counts with filters
    total_candidates = await db.recruitment_portal.candidates.count_documents(candidate_filter)
    applied_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "applied"})
    screen_reject_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "screen_reject"})
    interview_selected_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "interview_selected"})
    interview_reject_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "interview_reject"})
    no_show_for_joining_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "no_show_for_joining"})
    placed_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "placed"})
    
    # Get HR user count (no filter for this)
    hr_users = await db.recruitment_portal.users.count_documents({"role": "hr"})
    
    # Get HR performance data if HR filter is applied
    hr_performance = None
    if hr_id:
        hr_user = await db.recruitment_portal.users.find_one({"_id": ObjectId(hr_id), "role": "hr"})
        if hr_user:
            # Get jobs assigned to this HR
            hr_jobs = await db.recruitment_portal.jobs.find({"assigned_hr": hr_id}).to_list(length=1000)
            
            # Get candidates created by this HR
            hr_candidates = await db.recruitment_portal.candidates.find({"created_by": hr_id}).to_list(length=1000)
            
            hr_performance = {
                "hr_name": hr_user["name"],
                "hr_email": hr_user["email"],
                "total_assigned_jobs": len(hr_jobs),
                "open_jobs": len([j for j in hr_jobs if j["status"] == "open"]),
                "closed_jobs": len([j for j in hr_jobs if j["status"] == "closed"]),
                "submitted_jobs": len([j for j in hr_jobs if j["status"] == "submitted"]),
                "demand_closed_jobs": len([j for j in hr_jobs if j["status"] == "demand closed"]),
                "total_candidates": len(hr_candidates),
                "applied_candidates": len([c for c in hr_candidates if c["status"] == "applied"]),
                "screen_reject_candidates": len([c for c in hr_candidates if c["status"] == "screen_reject"]),
                "interview_selected_candidates": len([c for c in hr_candidates if c["status"] == "interview_selected"]),
                "interview_reject_candidates": len([c for c in hr_candidates if c["status"] == "interview_reject"]),
                "no_show_for_joining_candidates": len([c for c in hr_candidates if c["status"] == "no_show_for_joining"]),
                "placed_candidates": len([c for c in hr_candidates if c["status"] == "placed"])
            }
    
    return {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "closed_jobs": closed_jobs,
        "submitted_jobs": submitted_jobs,
        "demand_closed_jobs": demand_closed_jobs,
        "total_candidates": total_candidates,
        "applied_candidates": applied_candidates,
        "screen_reject_candidates": screen_reject_candidates,
        "interview_selected_candidates": interview_selected_candidates,
        "interview_reject_candidates": interview_reject_candidates,
        "no_show_for_joining_candidates": no_show_for_joining_candidates,
        "placed_candidates": placed_candidates,
        "hr_users": hr_users,
        "hr_performance": hr_performance,
        "filters_applied": {
            "report_type": report_type,
            "hr_id": hr_id,
            "custom_start_date": custom_start_date,
            "custom_end_date": custom_end_date
        }
    }

@router.get("/candidates")
async def get_all_candidates(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    candidates = await db.recruitment_portal.candidates.find({}).sort("created_at", -1).to_list(length=100)
    
    # Get all jobs for job title mapping
    jobs = await db.recruitment_portal.jobs.find({}).to_list(length=1000)
    job_map = {job["job_id"]: job["title"] for job in jobs}
    
    # Get all HR users for name mapping
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    hr_user_map = {str(user["_id"]): user["name"] for user in hr_users}
    
    for candidate in candidates:
        candidate["id"] = str(candidate["_id"])
        del candidate["_id"]
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in candidate and isinstance(candidate["created_at"], datetime):
            candidate["created_at"] = candidate["created_at"].isoformat()
        
        # Add job title information
        if candidate.get("job_id"):
            candidate["applied_for"] = job_map.get(candidate["job_id"], "Unknown Job")
            # Ensure job title is available for display
            if not candidate.get("job_title"):
                candidate["job_title"] = job_map.get(candidate["job_id"], "Unknown Job")
            if not candidate.get("title_position"):
                candidate["title_position"] = job_map.get(candidate["job_id"], "Unknown Job")
            if not candidate.get("role_applied_for"):
                candidate["role_applied_for"] = job_map.get(candidate["job_id"], "Unknown Job")
        
        # Add HR user information who created the candidate
        if candidate.get("created_by"):
            candidate["created_by_hr"] = hr_user_map.get(candidate["created_by"], "Unknown HR")
        else:
            candidate["created_by_hr"] = "Unknown HR"
    
    return candidates 

@router.get("/hr-contribution")
async def get_hr_contribution(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Get all HR users
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    
    # Get submitted jobs count for each HR
    hr_contribution = []
    for hr_user in hr_users:
        hr_id = str(hr_user["_id"])
        submitted_jobs_count = await db.recruitment_portal.jobs.count_documents({
            "assigned_hr": hr_id,
            "status": "submitted"
        })
        
        hr_contribution.append({
            "hr_id": hr_id,
            "hr_name": hr_user["name"],
            "hr_email": hr_user["email"],
            "submitted_jobs_count": submitted_jobs_count
        })
    
    return hr_contribution

@router.get("/salary-bands")
async def get_salary_bands(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    try:
        salary_bands = await db.recruitment_portal.salary_bands.find({}).sort("band", 1).to_list(length=100)
        
        # Format the data for frontend
        formatted_bands = []
        for band in salary_bands:
            formatted_bands.append({
                "band": band["band"],
                "experience_range": band.get("experience_range"),
                "rates": {
                    "standard": band["standard"],
                    "ra1": band["ra1"],
                    "ra2": band["ra2"]
                }
            })
        
        return formatted_bands
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching salary bands: {str(e)}")

@router.get("/hr-report")
async def download_hr_report(
    report_type: Optional[str] = None,  # "weekly", "monthly", "custom"
    hr_id: Optional[str] = None,  # If None, generate report for all HR
    custom_start_date: Optional[str] = None,
    custom_end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Build date filter based on report type
    date_filter = {}
    if report_type:
        now = datetime.now(timezone.utc)
        
        if report_type == "weekly":
            # Last 7 days
            start_date = now - timedelta(days=7)
            date_filter = {
                "start_date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": now.strftime("%Y-%m-%d")
                }
            }
        elif report_type == "monthly":
            # Last 30 days
            start_date = now - timedelta(days=30)
            date_filter = {
                "start_date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": now.strftime("%Y-%m-%d")
                }
            }
        elif report_type == "custom" and custom_start_date and custom_end_date:
            # Custom date range
            date_filter = {
                "start_date": {
                    "$gte": custom_start_date,
                    "$lte": custom_end_date
                }
            }
    
    # Build HR filter
    hr_filter = {}
    if hr_id:
        hr_filter["assigned_hr"] = hr_id
    
    # Combine filters
    job_filter = {**date_filter, **hr_filter}
    candidate_filter = {**date_filter}
    if hr_id:
        candidate_filter["created_by"] = hr_id
    
    # Get HR users to report on
    if hr_id:
        # Single HR report
        hr_users = await db.recruitment_portal.users.find({"_id": ObjectId(hr_id), "role": "hr"}).to_list(length=1)
    else:
        # All HR report
        hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    
    if not hr_users:
        raise HTTPException(status_code=404, detail="No HR users found")
    
    # Prepare Excel data
    excel_data = []
    
    for hr_user in hr_users:
        hr_id_str = str(hr_user["_id"])
        
        # Get job statistics for this HR
        total_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "assigned_hr": hr_id_str})
        open_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "assigned_hr": hr_id_str, "status": "open"})
        closed_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "assigned_hr": hr_id_str, "status": "closed"})
        submitted_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "assigned_hr": hr_id_str, "status": "submitted"})
        demand_closed_jobs = await db.recruitment_portal.jobs.count_documents({**job_filter, "assigned_hr": hr_id_str, "status": "demand closed"})
        
        # Get candidate statistics for this HR
        total_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "created_by": hr_id_str})
        selected_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "created_by": hr_id_str, "status": "selected"})
        
        # Get selected candidates with job titles
        selected_candidates_data = await db.recruitment_portal.candidates.find(
            {**candidate_filter, "created_by": hr_id_str, "status": "selected"}
        ).to_list(length=1000)
        
        # Prepare candidate names with job titles
        candidate_details = []
        for candidate in selected_candidates_data:
            candidate_details.append(f"{candidate.get('name', 'N/A')} - {candidate.get('job_title', 'N/A')}")
        
        # Add to Excel data
        excel_data.append({
            "HR Name": hr_user["name"],
            "HR Email": hr_user["email"],
            "Total Jobs Allocated": total_jobs,
            "Open Jobs": open_jobs,
            "Closed Jobs": closed_jobs,
            "Submitted Jobs": submitted_jobs,
            "Demand Closed Jobs": demand_closed_jobs,
            "Total Candidates Added": total_candidates,
            "Selected Candidates Count": selected_candidates,
            "Selected Candidates (Name - Job Title)": "; ".join(candidate_details) if candidate_details else "None"
        })
    
    # Create Excel file
    df = pd.DataFrame(excel_data)
    
    # Create Excel writer
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='HR Report', index=False)
        
        # Auto-adjust column widths
        worksheet = writer.sheets['HR Report']
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    # Generate filename
    if hr_id:
        hr_name = hr_users[0]["name"].replace(" ", "_")
        filename = f"HR_Report_{hr_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    else:
        filename = f"All_HR_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    ) 

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Find job by job_id field first, then by _id
    job = await db.recruitment_portal.jobs.find_one({"job_id": job_id})
    if not job:
        # Fallback to _id if job_id not found
        try:
            job = await db.recruitment_portal.jobs.find_one({"_id": ObjectId(job_id)})
        except:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete the job
    result = await db.recruitment_portal.jobs.delete_one({"_id": job["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully"} 

@router.get("/hr-revenue")
async def get_hr_revenue(current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    # Get current year for annual revenue calculation
    current_year = datetime.now().year
    start_of_year = datetime(current_year, 1, 1)
    end_of_year = datetime(current_year, 12, 31, 23, 59, 59)
    
    # Get all placed candidates for the current year
    placed_candidates = await db.recruitment_portal.candidates.find({
        "status": "placed",
        "created_at": {
            "$gte": start_of_year,
            "$lte": end_of_year
        }
    }).to_list(length=1000)
    
    # Get all HR users
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    hr_map = {str(hr["_id"]): hr["name"] for hr in hr_users}
    
    # Calculate revenue for each HR
    hr_revenue = {}
    
    for candidate in placed_candidates:
        hr_id = candidate.get("created_by")
        if not hr_id:
            continue
            
        hr_name = hr_map.get(hr_id, "Unknown HR")
        
        # Get the job details to calculate revenue
        job = await db.recruitment_portal.jobs.find_one({"job_id": candidate.get("job_id")})
        if not job:
            continue
            
        # Calculate revenue: actual_salary - expected_package
        actual_salary = float(job.get("salary_package", 0)) if job.get("salary_package") else 0
        expected_package = float(job.get("expected_package", 0)) if job.get("expected_package") else 0
        
        revenue = actual_salary - expected_package
        
        if hr_name not in hr_revenue:
            hr_revenue[hr_name] = 0
        
        hr_revenue[hr_name] += revenue
    
    # Convert to list format for frontend
    revenue_data = []
    for hr_name, revenue in hr_revenue.items():
        revenue_data.append({
            "hr_name": hr_name,
            "revenue": round(revenue, 2)
        })
    
    # Sort by revenue in descending order
    revenue_data.sort(key=lambda x: x["revenue"], reverse=True)
    
    return revenue_data 

@router.get("/job-history")
async def get_job_history(
    page: Optional[int] = 1,
    limit: Optional[int] = 25,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Get job history from the job_history collection.
    This contains jobs that were moved to history due to expiration.
    """
    # Validate pagination parameters
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 25
    
    db = await get_database()
    
    # Build filter
    filter_query = {}
    
    # Handle search functionality
    if search:
        # Create a regex pattern for case-insensitive search
        import re
        search_pattern = re.compile(search, re.IGNORECASE)
        filter_query["$or"] = [
            {"title": search_pattern},
            {"description": search_pattern},
            {"job_id": search_pattern},
            {"csa_id": search_pattern},
            {"location": search_pattern},
            {"salary_package": search_pattern}
        ]
    
    # Get total count for pagination
    total_jobs = await db.recruitment_portal.job_history.count_documents(filter_query)
    
    # Calculate pagination
    total_pages = (total_jobs + limit - 1) // limit
    skip = (page - 1) * limit
    
    # Get all HR users for name mapping
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    hr_user_map = {str(user["_id"]): user["name"] for user in hr_users}
    
    # Get paginated job history
    jobs = await db.recruitment_portal.job_history.find(filter_query).sort("moved_to_history_date", -1).skip(skip).limit(limit).to_list(length=limit)
    
    for job in jobs:
        # Convert ObjectId to string for JSON serialization
        job["id"] = str(job["_id"])
        del job["_id"]
        
        # Handle original_job_id if it exists (it's also an ObjectId)
        if "original_job_id" in job and job["original_job_id"]:
            job["original_job_id"] = str(job["original_job_id"])
        
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in job and isinstance(job["created_at"], datetime):
            job["created_at"] = job["created_at"].isoformat()
        if "start_date" in job and isinstance(job["start_date"], datetime):
            job["start_date"] = job["start_date"].isoformat()
        if "end_date" in job and isinstance(job["end_date"], datetime):
            job["end_date"] = job["end_date"].isoformat()
        if "moved_to_history_date" in job and isinstance(job["moved_to_history_date"], datetime):
            job["moved_to_history_date"] = job["moved_to_history_date"].isoformat()
        
        # Add HR user name if assigned
        if job.get("assigned_hr"):
            job["assigned_hr_name"] = hr_user_map.get(job["assigned_hr"], "Unknown")
    
    return {
        "jobs": jobs,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_jobs": total_jobs,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.delete("/job-history/bulk-delete")
async def bulk_delete_job_history(
    job_ids: List[str],
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Bulk delete job history records by their IDs.
    """
    if not job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided")
    
    db = await get_database()
    
    # Convert string IDs to ObjectId
    try:
        object_ids = [ObjectId(job_id) for job_id in job_ids]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid job ID format: {str(e)}")
    
    # Delete the records
    try:
        result = await db.recruitment_portal.job_history.delete_many({"_id": {"$in": object_ids}})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="No records found to delete")
        
        return {
            "message": f"Successfully deleted {result.deleted_count} job history records",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting records: {str(e)}")

@router.put("/change-password")
async def change_password(
    password_data: dict,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Change password for admin user.
    """
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    db = await get_database()
    
    # Verify current password
    if not verify_password(current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_new_password = get_password_hash(new_password)
    
    # Update password in database
    result = await db.recruitment_portal.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": hashed_new_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    return {"message": "Password updated successfully"}