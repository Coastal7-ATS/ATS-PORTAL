from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: str
    role: str  # "admin" or "hr"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime

class JobBase(BaseModel):
    title: str
    description: str
    location: str
    salary_package: str
    source_company: str
    csa_id: str  # 6 character alphanumeric
    start_date: datetime
    end_date: datetime

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: str
    uploaded_by: str
    allocated_to: Optional[str] = None
    status: str = "open"  # "open", "allocated", "closed", "submit"
    created_at: datetime

class SkillAssessment(BaseModel):
    skill_name: str
    years_of_experience: str
    last_used_year: str
    vendor_sme_assessment_score: Optional[int] = None  # 1-4

class WorkExperienceEntry(BaseModel):
    organization: str
    end_client: str
    project: str
    start_month_year: str
    end_month_year: str
    technology_tools: str
    role_designation: str
    responsibilities: List[str] = []
    additional_information: Optional[str] = None

class ExperienceEntry(BaseModel):
    organization: str
    end_client: str
    project: str
    start_month_year: str
    end_month_year: str
    technology_tools: str

class CandidateBase(BaseModel):
    # Required fields
    name: str
    email: str
    phone: str
    
    # Basic Information
    title_position: Optional[str] = None
    pan_number: Optional[str] = None
    passport_number: Optional[str] = None
    current_location: Optional[str] = None
    hometown: Optional[str] = None
    preferred_interview_location: Optional[str] = None
    interview_location: Optional[str] = None  # New field
    availability_interview: Optional[str] = None  # weekends/weekdays/both
    
    # General Information
    roc_check_done: Optional[str] = None  # YES/NO
    applied_for_ibm_before: Optional[str] = None  # YES/NO
    is_organization_employee: Optional[str] = None  # YES/NO
    date_of_joining_organization: Optional[str] = None
    client_deployment_details: Optional[List[str]] = []
    interested_in_relocation: Optional[str] = None  # YES/NO
    willingness_work_shifts: Optional[str] = None  # YES/NO
    role_applied_for: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    current_role: Optional[str] = None
    notice_period: Optional[str] = None
    payrolling_company_name: Optional[str] = None
    education_authenticated_ugc_check: Optional[str] = None  # New field for UGC education verification
    
    # Experience Information
    total_experience: Optional[str] = None
    relevant_experience: Optional[str] = None
    # Removed: skill_level_experience, overall_years_experience, experience
    
    # Assessment Information - Updated to use dropdown scores 1-4
    general_attitude_assessment: Optional[int] = None  # 1-4 dropdown
    oral_communication_assessment: Optional[int] = None  # 1-4 dropdown
    general_attitude_comments: Optional[str] = None
    oral_communication_comments: Optional[str] = None
    
    # SME Information
    sme_name: Optional[str] = None
    sme_email: Optional[str] = None
    sme_mobile: Optional[str] = None
    
    # SME Declaration
    do_not_know_candidate: Optional[str] = None  # YES/NO
    evaluated_resume_with_jd: Optional[str] = None  # YES/NO
    personally_spoken_to_candidate: Optional[str] = None  # YES/NO
    available_for_clarification: Optional[str] = None  # YES/NO
    
    # Verification - Updated
    salary_slip_verified: Optional[str] = None  # YES/NO
    offer_letter_verified: Optional[str] = None  # YES/NO
    test_mail_sent_to_organization: Optional[str] = None  # YES/NO - New field replacing education_authenticated_ugc
    
    # Assessment Details
    talent_acquisition_consultant: Optional[str] = None
    date_of_assessment: Optional[str] = None
    
    # Education - Class X
    education_x_institute: Optional[str] = None
    education_x_start_date: Optional[str] = None
    education_x_end_date: Optional[str] = None
    education_x_percentage: Optional[str] = None
    education_x_year_completion: Optional[str] = None
    
    # Education - Class XII
    education_xii_institute: Optional[str] = None
    education_xii_start_date: Optional[str] = None
    education_xii_end_date: Optional[str] = None
    education_xii_percentage: Optional[str] = None
    education_xii_year_completion: Optional[str] = None
    
    # Education - Degree
    education_degree_name: Optional[str] = None
    education_degree_institute: Optional[str] = None
    education_degree_start_date: Optional[str] = None
    education_degree_end_date: Optional[str] = None
    education_degree_percentage: Optional[str] = None
    education_degree_year_completion: Optional[str] = None
    education_degree_duration: Optional[str] = None
    education_additional_certifications: Optional[str] = None
    
    # Legacy education fields (keeping for backward compatibility)
    education_x: Optional[str] = None
    education_xii: Optional[str] = None
    education_degree: Optional[str] = None
    education_percentage: Optional[str] = None
    education_duration: Optional[str] = None
    
    # Work Experience
    work_experience_entries: Optional[List[WorkExperienceEntry]] = []
    experience_entries: Optional[List[ExperienceEntry]] = []
    
    # Skills Assessment
    skill_assessments: Optional[List[SkillAssessment]] = []
    
    # Additional fields
    certifications: Optional[str] = None
    publications_title: Optional[str] = None
    publications_date: Optional[str] = None
    publications_publisher: Optional[str] = None
    publications_description: Optional[str] = None
    references: Optional[str] = None
    
    # Legacy fields (keeping for backward compatibility)
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    projects: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    
    job_id: str
    status: Optional[str] = "applied"
    applied_date: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    # Required fields - made optional for partial updates
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Basic Information
    title_position: Optional[str] = None
    pan_number: Optional[str] = None
    passport_number: Optional[str] = None
    current_location: Optional[str] = None
    hometown: Optional[str] = None
    preferred_interview_location: Optional[str] = None
    interview_location: Optional[str] = None  # New field
    availability_interview: Optional[str] = None  # weekends/weekdays/both
    
    # General Information
    roc_check_done: Optional[str] = None  # YES/NO
    applied_for_ibm_before: Optional[str] = None  # YES/NO
    is_organization_employee: Optional[str] = None  # YES/NO
    date_of_joining_organization: Optional[str] = None
    client_deployment_details: Optional[List[str]] = []
    interested_in_relocation: Optional[str] = None  # YES/NO
    willingness_work_shifts: Optional[str] = None  # YES/NO
    role_applied_for: Optional[str] = None
    reason_for_job_change: Optional[str] = None
    current_role: Optional[str] = None
    notice_period: Optional[str] = None
    payrolling_company_name: Optional[str] = None
    education_authenticated_ugc_check: Optional[str] = None  # New field for UGC education verification
    
    # Experience Information
    total_experience: Optional[str] = None
    relevant_experience: Optional[str] = None
    
    # Assessment Information - Updated to use dropdown scores 1-4
    general_attitude_assessment: Optional[int] = None  # 1-4 dropdown
    oral_communication_assessment: Optional[int] = None  # 1-4 dropdown
    general_attitude_comments: Optional[str] = None
    oral_communication_comments: Optional[str] = None
    
    # SME Information
    sme_name: Optional[str] = None
    sme_email: Optional[str] = None
    sme_mobile: Optional[str] = None
    
    # SME Declaration
    do_not_know_candidate: Optional[str] = None  # YES/NO
    evaluated_resume_with_jd: Optional[str] = None  # YES/NO
    personally_spoken_to_candidate: Optional[str] = None  # YES/NO
    available_for_clarification: Optional[str] = None  # YES/NO
    
    # Verification - Updated
    salary_slip_verified: Optional[str] = None  # YES/NO
    offer_letter_verified: Optional[str] = None  # YES/NO
    test_mail_sent_to_organization: Optional[str] = None  # YES/NO - New field replacing education_authenticated_ugc
    
    # Assessment Details
    talent_acquisition_consultant: Optional[str] = None
    date_of_assessment: Optional[str] = None
    
    # Education - Class X
    education_x_institute: Optional[str] = None
    education_x_start_date: Optional[str] = None
    education_x_end_date: Optional[str] = None
    education_x_percentage: Optional[str] = None
    education_x_year_completion: Optional[str] = None
    
    # Education - Class XII
    education_xii_institute: Optional[str] = None
    education_xii_start_date: Optional[str] = None
    education_xii_end_date: Optional[str] = None
    education_xii_percentage: Optional[str] = None
    education_xii_year_completion: Optional[str] = None
    
    # Education - Degree
    education_degree_name: Optional[str] = None
    education_degree_institute: Optional[str] = None
    education_degree_start_date: Optional[str] = None
    education_degree_end_date: Optional[str] = None
    education_degree_percentage: Optional[str] = None
    education_degree_year_completion: Optional[str] = None
    education_degree_duration: Optional[str] = None
    education_additional_certifications: Optional[str] = None
    
    # Legacy education fields (keeping for backward compatibility)
    education_x: Optional[str] = None
    education_xii: Optional[str] = None
    education_degree: Optional[str] = None
    education_percentage: Optional[str] = None
    education_duration: Optional[str] = None
    
    # Work Experience
    work_experience_entries: Optional[List[WorkExperienceEntry]] = []
    experience_entries: Optional[List[ExperienceEntry]] = []
    
    # Skills Assessment
    skill_assessments: Optional[List[SkillAssessment]] = []
    
    # Additional fields
    certifications: Optional[str] = None
    publications_title: Optional[str] = None
    publications_date: Optional[str] = None
    publications_publisher: Optional[str] = None
    publications_description: Optional[str] = None
    references: Optional[str] = None
    
    # Legacy fields (keeping for backward compatibility)
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    projects: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    
    # Optional for updates
    job_id: Optional[str] = None
    status: Optional[str] = "applied"
    applied_date: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None

class Candidate(CandidateBase):
    id: str
    status: str = "applied"  # "applied", "in_progress", "interviewed", "selected", "rejected"
    notes: Optional[str] = None
    last_updated_by: Optional[str] = None
    created_at: datetime

class ApplicationHistory(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    old_status: str
    new_status: str
    updated_by: str
    timestamp: datetime
    comment: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None 