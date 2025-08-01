from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from typing import Optional
from routes.auth import get_current_hr_user
from database import get_database

router = APIRouter(prefix="/hr", tags=["HR"])

@router.get("/jobs")
async def get_hr_jobs(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_hr_user)
):
    db = await get_database()
    
    # Build filter query
    filter_query = {"assigned_hr": str(current_user["_id"])}
    if status:
        filter_query["status"] = status
    
    jobs = await db.recruitment_portal.jobs.find(filter_query).sort("created_at", -1).to_list(length=100)
    
    for job in jobs:
        job["id"] = str(job["_id"])
        del job["_id"]
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in job and isinstance(job["created_at"], datetime):
            job["created_at"] = job["created_at"].isoformat()
        if "opening_date" in job and isinstance(job["opening_date"], datetime):
            job["opening_date"] = job["opening_date"].isoformat()
    
    return jobs

@router.put("/jobs/{job_id}/status")
async def update_job_status(
    job_id: str,
    status: str,
    current_user: dict = Depends(get_current_hr_user)
):
    db = await get_database()
    
    # Find job by job_id field instead of _id
    result = await db.recruitment_portal.jobs.update_one(
        {"job_id": job_id, "assigned_hr": str(current_user["_id"])},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or not allocated to you")
    
    return {"message": "Job status updated successfully"}

@router.get("/candidates/{job_id}")
async def get_candidates_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_hr_user)
):
    db = await get_database()
    
    # Verify job is allocated to this HR
    job = await db.recruitment_portal.jobs.find_one({
        "job_id": job_id,
        "assigned_hr": str(current_user["_id"])
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not allocated to you")
    
    candidates = await db.recruitment_portal.candidates.find({"job_id": job_id}).to_list(length=100)
    
    for candidate in candidates:
        candidate["id"] = str(candidate["_id"])
        del candidate["_id"]
        # Convert datetime fields to ISO format for JSON serialization
        if "created_at" in candidate and isinstance(candidate["created_at"], datetime):
            candidate["created_at"] = candidate["created_at"].isoformat()
        
        # Add job title information
        if candidate.get("job_id"):
            candidate["job_title"] = job.get("title")
            if not candidate.get("title_position"):
                candidate["title_position"] = job.get("title")
            if not candidate.get("role_applied_for"):
                candidate["role_applied_for"] = job.get("title")
    
    return candidates

@router.put("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    status: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_hr_user)
):
    db = await get_database()
    
    # Get candidate and verify job is allocated to this HR
    candidate = await db.recruitment_portal.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    job = await db.recruitment_portal.jobs.find_one({
        "job_id": candidate["job_id"],
        "assigned_hr": str(current_user["_id"])
    })
    
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized to update this candidate")
    
    old_status = candidate["status"]
    
    # Update candidate status
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

@router.get("/candidates")
async def get_all_hr_candidates(current_user: dict = Depends(get_current_hr_user)):
    db = await get_database()
    
    # Get jobs allocated to this HR
    jobs = await db.recruitment_portal.jobs.find({"assigned_hr": str(current_user["_id"])}).to_list(length=100)
    job_id_list = [job["job_id"] for job in jobs]
    job_map = {job["job_id"]: job["title"] for job in jobs}
    
    candidates = await db.recruitment_portal.candidates.find({"job_id": {"$in": job_id_list}}).to_list(length=100)
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
    
    return candidates

@router.get("/dashboard")
async def get_hr_dashboard(current_user: dict = Depends(get_current_hr_user)):
    db = await get_database()
    # Get job counts
    total_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": str(current_user["_id"])})
    open_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": str(current_user["_id"]), "status": "open"})
    closed_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": str(current_user["_id"]), "status": "closed"})
    allocated_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": str(current_user["_id"]), "status": "allocated"})
    submitted_jobs = await db.recruitment_portal.jobs.count_documents({"assigned_hr": str(current_user["_id"]), "status": "submit"})
    # Get candidate counts using job_id (string)
    jobs = await db.recruitment_portal.jobs.find({"assigned_hr": str(current_user["_id"])}).to_list(length=100)
    job_id_list = [job["job_id"] for job in jobs]
    total_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}})
    selected_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}, "status": "selected"})
    rejected_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}, "status": "rejected"})
    in_progress_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}, "status": "in_progress"})
    interviewed_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}, "status": "interviewed"})
    applied_candidates = await db.recruitment_portal.candidates.count_documents({"job_id": {"$in": job_id_list}, "status": "applied"})
    return {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "closed_jobs": closed_jobs,
        "allocated_jobs": allocated_jobs,
        "submitted_jobs": submitted_jobs,
        "total_candidates": total_candidates,
        "selected_candidates": selected_candidates,
        "rejected_candidates": rejected_candidates,
        "in_progress_candidates": in_progress_candidates,
        "interviewed_candidates": interviewed_candidates,
        "applied_candidates": applied_candidates
    } 