from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List
from models import CandidateCreate, CandidateUpdate
from routes.auth import get_current_user, get_current_admin_user, get_current_hr_user
from database import get_database
from fastapi.responses import JSONResponse

router = APIRouter(tags=["Shared"])

async def update_expired_job_statuses():
    """
    Shared function to update job statuses for expired jobs.
    Checks all open jobs that have passed their end date and updates them to 'demand closed'
    if they don't have any selected candidates.
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
        }).to_list(length=200)
        
        print(f"Found {len(open_jobs_past_end)} open jobs past end date")
        
        updated_count = 0
        for job in open_jobs_past_end:
            try:
                # Check if any candidate for this job is selected
                selected = await db.recruitment_portal.candidates.find_one({
                    "job_id": job["job_id"], 
                    "status": "selected"
                })
                
                if not selected:
                    # No selected candidates found, update to demand closed
                    result = await db.recruitment_portal.jobs.update_one(
                        {"_id": job["_id"]}, 
                        {"$set": {"status": "demand closed"}}
                    )
                    if result.modified_count > 0:
                        updated_count += 1
                        print(f"Updated job {job.get('job_id', 'unknown')} to demand closed")
            except Exception as e:
                print(f"Error processing job {job.get('job_id', 'unknown')}: {e}")
                continue
        
        print(f"Total jobs updated to demand closed: {updated_count}")
        return updated_count
    except Exception as e:
        print(f"Error in update_expired_job_statuses: {e}")
        return 0

@router.get("/jobs/{job_id}")
async def get_job_details(job_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
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
    
    # Update expired job statuses first
    await update_expired_job_statuses()
    
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
    ).sort("timestamp", -1).to_list(length=100)
    
    for entry in history:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        # Convert datetime to ISO format for JSON serialization
        if "timestamp" in entry and isinstance(entry["timestamp"], datetime):
            entry["timestamp"] = entry["timestamp"].isoformat()
    
    return history 