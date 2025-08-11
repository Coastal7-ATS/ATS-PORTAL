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
from routes.auth import get_current_admin_user
from database import get_database
from routes.shared import update_expired_job_statuses

router = APIRouter(prefix="/admin", tags=["Admin"])

ALLOWED_JOB_STATUSES = ["open", "closed", "submitted", "demand closed"]
MANUAL_JOB_STATUSES = ["open", "closed", "submitted"]

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin_user)):
    db = await get_database()
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read CSV file
        df = pd.read_csv(file.file)
        
        # Validate required columns
        required_columns = ['title', 'description', 'location', 'ctc', 'csa_id', 'start_date', 'end_date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_columns}")
        
        jobs_added = 0
        for _, row in df.iterrows():
            # Generate unique job ID
            job_id = f"jb{datetime.now().strftime('%m%d%H%M')}{random.randint(10, 99)}"
            
            # Parse dates from CSV
            start_date = datetime.fromisoformat(row['start_date']) if row['start_date'] else datetime.now(timezone.utc)
            end_date = datetime.fromisoformat(row['end_date']) if row['end_date'] else datetime.now(timezone.utc)
            
            job_data = {
                "job_id": job_id,
                "title": row['title'],
                "description": row['description'],
                "location": row['location'],
                "salary_package": row['ctc'],
                "csa_id": row['csa_id'],
                "start_date": start_date,
                "end_date": end_date,
                "source_company": "CSV Upload",
                "uploaded_by": str(current_user["_id"]),
                "status": "open",
                "created_at": datetime.now(timezone.utc)
            }
            
            result = await db.recruitment_portal.jobs.insert_one(job_data)
            jobs_added += 1
        
        return {"message": f"Successfully uploaded {jobs_added} jobs"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

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
    
    jobs_added = 0
    for job_data in jobs_data:
        # Generate unique job ID - smaller format
        job_id = f"jb{datetime.now().strftime('%m%d%H%M')}{random.randint(10, 99)}"
        
        job_data["job_id"] = job_id
        job_data["uploaded_by"] = str(current_user["_id"])
        status = job_data.get("status", "open")
        if status not in MANUAL_JOB_STATUSES:
            status = "open"
        job_data["status"] = status
        job_data["created_at"] = datetime.now(timezone.utc)
        # Handle salary package - use actual_salary if provided, otherwise use ctc for backward compatibility
        if "actual_salary" in job_data:
            job_data["salary_package"] = job_data["actual_salary"]
        elif "ctc" in job_data:
            job_data["salary_package"] = job_data["ctc"]
        else:
            job_data["salary_package"] = ""
        job_data["source_company"] = "CSV Upload"
        
        # Set default dates if not provided
        if "start_date" not in job_data:
            job_data["start_date"] = datetime.now(timezone.utc)
        if "end_date" not in job_data:
            job_data["end_date"] = datetime.now(timezone.utc)
        
        result = await db.recruitment_portal.jobs.insert_one(job_data)
        jobs_added += 1
    
    return {"message": f"Successfully added {jobs_added} jobs"}

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
    current_user: dict = Depends(get_current_admin_user)
):

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

    # Get all HR users for name mapping
    hr_users = await db.recruitment_portal.users.find({"role": "hr"}).to_list(length=100)
    hr_user_map = {str(user["_id"]): user["name"] for user in hr_users}
    
    jobs = await db.recruitment_portal.jobs.find(filter_query).sort("created_at", -1).to_list(length=100)
    
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
    return jobs

@router.put("/jobs/{job_id}/allocate")
async def allocate_job(
    job_id: str,
    hr_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
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
async def get_admin_dashboard(
    report_type: Optional[str] = None,  # "weekly", "monthly", "custom"
    hr_id: Optional[str] = None,
    custom_start_date: Optional[str] = None,
    custom_end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin_user)
):
    db = await get_database()
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
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
    selected_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "selected"})
    rejected_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "rejected"})
    interview_selected_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "interview_selected"})
    interview_reject_candidates = await db.recruitment_portal.candidates.count_documents({**candidate_filter, "status": "interview_reject"})
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
                "selected_candidates": len([c for c in hr_candidates if c["status"] == "selected"]),
                "rejected_candidates": len([c for c in hr_candidates if c["status"] == "rejected"]),
                "interview_selected_candidates": len([c for c in hr_candidates if c["status"] == "interview_selected"]),
                "interview_reject_candidates": len([c for c in hr_candidates if c["status"] == "interview_reject"]),
                "placed_candidates": len([c for c in hr_candidates if c["status"] == "placed"])
            }
    
    return {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "closed_jobs": closed_jobs,
        "submitted_jobs": submitted_jobs,
        "demand_closed_jobs": demand_closed_jobs,
        "total_candidates": total_candidates,
        "selected_candidates": selected_candidates,
        "rejected_candidates": rejected_candidates,
        "interview_selected_candidates": interview_selected_candidates,
        "interview_reject_candidates": interview_reject_candidates,
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
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
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