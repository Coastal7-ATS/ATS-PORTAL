from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List
from models import CandidateCreate, CandidateUpdate
from routes.auth import get_current_user, get_current_admin_user, get_current_hr_user
from database import get_database
from fastapi.responses import JSONResponse
from config import settings

router = APIRouter(tags=["Shared"])

async def update_expired_job_statuses():
    """
    Shared function to update job statuses for expired jobs.
    Checks all open jobs that have passed their end date and updates them to 'demand closed'
    if they don't have any selected candidates. Moves these jobs to job_history collection
    and deletes them from the original collection.
    """
    try:
        db = await get_database()
        now = datetime.now(timezone.utc)
        
        # Find all open jobs that have passed their end date
        # Convert current date to string format for comparison
        current_date_str = now.strftime("%Y-%m-%d")
        
        open_jobs_past_end = await db.recruitment_portal.jobs.find({
            "status": "open", 
            "end_date": {"$lte": current_date_str}
        }).to_list(length=settings.MAX_QUERY_LIMIT_MEDIUM)
        
        print(f"Found {len(open_jobs_past_end)} open jobs past end date")
        
        updated_count = 0
        for job in open_jobs_past_end:
            try:
                # Check if any candidate for this job is interview_selected or placed
                selected = await db.recruitment_portal.candidates.find_one({
                    "job_id": job["job_id"], 
                    "status": {"$in": ["interview_selected", "placed"]}
                })
                
                if not selected:
                    # Check if job already exists in job_history to prevent duplicates
                    existing_in_history = await db.recruitment_portal.job_history.find_one({
                        "original_job_id": job["_id"]
                    })
                    
                    if existing_in_history:
                        print(f"Job {job.get('job_id', 'unknown')} already exists in job_history, skipping")
                        continue
                    
                    # No selected candidates found, move to job_history and delete from original
                    # Update job status to demand_closed before moving to history
                    job["status"] = "demand_closed"
                    
                    # Add additional fields for history tracking
                    job_history_doc = {
                        **job,
                        "moved_to_history_date": now,
                        "moved_to_history_reason": "end_date_passed_no_candidates",
                        "original_job_id": job["_id"]
                    }
                    
                    # Remove the _id field from the history document to avoid ObjectId serialization issues
                    # MongoDB will generate a new _id for the history document
                    if "_id" in job_history_doc:
                        del job_history_doc["_id"]
                    
                    # Insert into job_history collection
                    await db.recruitment_portal.job_history.insert_one(job_history_doc)
                    
                    # Delete from original collection
                    result = await db.recruitment_portal.jobs.delete_one({"_id": job["_id"]})
                    
                    if result.deleted_count > 0:
                        updated_count += 1
                        print(f"Moved job {job.get('job_id', 'unknown')} to job_history and deleted from original")
            except Exception as e:
                print(f"Error processing job {job.get('job_id', 'unknown')}: {e}")
                continue
        
        print(f"Total jobs moved to history and deleted: {updated_count}")
        return updated_count
    except Exception as e:
        print(f"Error in update_expired_job_statuses: {e}")
        return 0

@router.get("/jobs/{job_id}")
async def get_job_details(job_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    
    # Try to find job by job_id field first, then by _id
    job = await db.recruitment_portal.jobs.find_one({"job_id": job_id})
    if not job:
        # Fallback to _id if job_id not found
        try:
            job = await db.recruitment_portal.jobs.find_one({"_id": ObjectId(job_id)})
        except:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job["id"] = str(job["_id"])
    del job["_id"]
    
    return job

@router.get("/candidates/{candidate_id}")
async def get_candidate_details(candidate_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    candidate = await db.recruitment_portal.candidates.find_one({"_id": ObjectId(candidate_id)})
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get job information if job_id exists
    if candidate.get("job_id"):
        job = await db.recruitment_portal.jobs.find_one({"job_id": candidate["job_id"]})
        if job:
            candidate["job_title"] = job.get("title")
            # Ensure title_position and role_applied_for are set to job title if not already set
            if not candidate.get("title_position"):
                candidate["title_position"] = job.get("title")
            if not candidate.get("role_applied_for"):
                candidate["role_applied_for"] = job.get("title")
    
    candidate["id"] = str(candidate["_id"])
    del candidate["_id"]
    
    return candidate

@router.post("/candidates")
async def create_candidate(candidate: CandidateCreate, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    
    # Validate email format
    import re
    email_pattern = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    if not email_pattern.match(candidate.email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address with @ symbol")
    
    # Validate phone format (10 digits)
    phone_pattern = re.compile(r'^\d{10}$')
    if not phone_pattern.match(candidate.phone):
        raise HTTPException(status_code=400, detail="Phone number must contain exactly 10 digits")
    
    # Validate PAN number format
    pan_pattern = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    if not pan_pattern.match(candidate.pan_number):
        raise HTTPException(status_code=400, detail="PAN Number must be in format ABCDE1234F")
    
    candidate_data = candidate.model_dump()
    created_at = datetime.utcnow()
    candidate_data["created_at"] = created_at
    candidate_data["created_by"] = str(current_user["_id"])
    
    # Verify the job exists and is assigned to this HR user
    job = await db.recruitment_portal.jobs.find_one({
        "job_id": candidate_data["job_id"],
        "assigned_hr": str(current_user["_id"])
    })
    
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized to add candidates to this job")
    
    # Save the job title with the candidate data
    candidate_data["job_title"] = job.get("title")
    candidate_data["title_position"] = job.get("title")
    candidate_data["role_applied_for"] = job.get("title")
    
    result = await db.recruitment_portal.candidates.insert_one(candidate_data)
    candidate_data["id"] = str(result.inserted_id)
    # Remove MongoDB _id if present
    candidate_data.pop("_id", None)
    
    # Convert datetime to ISO format for JSON serialization
    response_data = candidate_data.copy()
    response_data["created_at"] = created_at.isoformat()
    
    return JSONResponse(status_code=201, content={
        "message": "Candidate added successfully",
        "candidate": response_data
    })

@router.put("/candidates/{candidate_id}")
async def update_candidate(
    candidate_id: str,
    candidate_update: CandidateUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    # Get the current candidate to preserve job_id if not provided in update
    current_candidate = await db.recruitment_portal.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not current_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Prepare update data, preserving job_id if not provided
    update_data = candidate_update.model_dump()
    if not update_data.get("job_id"):
        update_data["job_id"] = current_candidate.get("job_id")
    
    # Preserve existing values for required fields if not provided in update
    if not update_data.get("name"):
        update_data["name"] = current_candidate.get("name")
    if not update_data.get("email"):
        update_data["email"] = current_candidate.get("email")
    if not update_data.get("phone"):
        update_data["phone"] = current_candidate.get("phone")
    if not update_data.get("pan_number"):
        update_data["pan_number"] = current_candidate.get("pan_number")
    
    # Validate email format if provided
    import re
    if update_data.get("email"):
        email_pattern = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
        if not email_pattern.match(update_data["email"]):
            raise HTTPException(status_code=400, detail="Please enter a valid email address with @ symbol")
    
    # Validate phone format if provided
    if update_data.get("phone"):
        phone_pattern = re.compile(r'^\d{10}$')
        if not phone_pattern.match(update_data["phone"]):
            raise HTTPException(status_code=400, detail="Phone number must contain exactly 10 digits")
    
    # Validate PAN number format if provided
    if update_data.get("pan_number"):
        pan_pattern = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
        if not pan_pattern.match(update_data["pan_number"]):
            raise HTTPException(status_code=400, detail="PAN Number must be in format ABCDE1234F")
    
    # Remove None values to avoid overwriting with None
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = await db.recruitment_portal.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {"message": "Candidate updated successfully"}

@router.put("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    status: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    candidate = await db.recruitment_portal.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    # Allow both admin and HR to update status, no job HR restriction
    old_status = candidate.get("status", "")
    await db.recruitment_portal.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {
            "status": status,
            "notes": notes,
            "last_updated_by": str(current_user["_id"])
        }}
    )
    # Add to history
    history_entry = {
        "candidate_id": candidate_id,
        "job_id": candidate["job_id"],
        "old_status": old_status,
        "new_status": status,
        "updated_by": str(current_user["_id"]),
        "timestamp": datetime.utcnow(),
        "comment": notes
    }
    await db.recruitment_portal.application_history.insert_one(history_entry)
    return {"message": "Candidate status updated successfully"}

@router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    
    # Check if candidate exists
    candidate = await db.recruitment_portal.candidates.find_one({"_id": ObjectId(candidate_id)})
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check permissions - only admin or the HR who created the candidate can delete
    if current_user.get("role") != "admin":
        # For HR users, check if they created this candidate or if it's assigned to their job
        if candidate.get("created_by") != str(current_user["_id"]):
            # Check if the candidate is assigned to a job that belongs to this HR
            if candidate.get("job_id"):
                job = await db.recruitment_portal.jobs.find_one({"job_id": candidate["job_id"]})
                if not job or job.get("assigned_hr") != str(current_user["_id"]):
                    raise HTTPException(status_code=403, detail="You don't have permission to delete this candidate")
    
    # Delete the candidate
    result = await db.recruitment_portal.candidates.delete_one({"_id": ObjectId(candidate_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {"message": "Candidate deleted successfully"}

@router.get("/application-history/{candidate_id}")
async def get_application_history(candidate_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    history = await db.recruitment_portal.application_history.find(
        {"candidate_id": candidate_id}
    ).sort("timestamp", -1).to_list(length=settings.MAX_QUERY_LIMIT)
    
    for entry in history:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        # Convert datetime to ISO format for JSON serialization
        if "timestamp" in entry and isinstance(entry["timestamp"], datetime):
            entry["timestamp"] = entry["timestamp"].isoformat()
    
    return history 