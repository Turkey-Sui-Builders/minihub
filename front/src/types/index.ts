// ====== Sui Smart Contract Types ======

/**
 * JobBoard - Main board containing all job postings
 * Matches: public struct JobBoard has key
 */
export interface JobBoard {
  id: string;                           // UID
  job_count: number;                    // Total number of job postings (u64)
  job_ids: string[];                    // All published job IDs (vector<ID>)
}

/**
 * Job - Represents a job posting on-chain
 * Matches: public struct Job has key, store
 */
export interface Job {
  id: string;                           // UID
  employer: string;                     // Employer wallet address
  title: string;                        // Job title (String)
  description: string;                  // Job description (String)
  salary: number | null;                // Optional salary in SUI tokens (Option<u64>)
  application_count: number;            // Number of applications (u64)
  hired_candidate: string | null;       // Hired candidate address (Option<address>)
  is_active: boolean;                   // Is job posting active? (bool)
  deadline: number;                     // Application deadline timestamp in ms (u64)
}

/**
 * ApplicationProfile - Candidate's application as dynamic object
 * Matches: public struct ApplicationProfile has key, store
 */
export interface ApplicationProfile {
  id: string;                           // UID
  candidate: string;                    // Candidate wallet address
  job_id: string;                       // Job ID reference (ID)
  cover_message: string;                // Cover letter/message (String)
  timestamp: number;                    // Application timestamp in ms (u64)
  cv_url: string;                       // CV/Resume URL (String)
}

/**
 * ApplicationKey - Key for storing ApplicationProfile as dynamic object field
 * Matches: public struct ApplicationKey has copy, drop, store
 */
export interface ApplicationKey {
  candidate: string;                    // Candidate address
  index: number;                        // Index for multiple applications from same candidate (u64)
}

/**
 * EmployerCap - Employer capability proving job ownership
 * Matches: public struct EmployerCap has key, store
 */
export interface EmployerCap {
  id: string;                           // UID
  job_id: string;                       // Job ID this capability controls (ID)
}

// ====== Events ======

/**
 * JobPosted - Event triggered when job is posted
 */
export interface JobPostedEvent {
  job_id: string;                       // Job ID
  employer: string;                     // Employer address
  title: string;                        // Job title
  has_salary: boolean;                  // Whether salary is specified
  deadline: number;                     // Application deadline
}

/**
 * ApplicationSubmitted - Event triggered when application is submitted
 */
export interface ApplicationSubmittedEvent {
  job_id: string;                       // Job ID
  candidate: string;                    // Candidate address
  timestamp: number;                    // Application timestamp
  application_id: string;               // Application profile ID
}

/**
 * CandidateHired - Event triggered when candidate is hired
 */
export interface CandidateHiredEvent {
  job_id: string;                       // Job ID
  employer: string;                     // Employer address
  candidate: string;                    // Hired candidate address
}

/**
 * JobBoardCreated - Event triggered when job board is created
 */
export interface JobBoardCreatedEvent {
  job_board_id: string;                 // Job board ID
}

/**
 * UpgradeCapTransferred - Event triggered when upgrade capability is transferred
 */
export interface UpgradeCapTransferredEvent {
  publisher_id: string;                 // Publisher object ID
  recipient: string;                    // Recipient address
}

// ====== UI/Frontend Types ======

/**
 * JobDisplay - Enriched job data for UI display
 * Extends on-chain Job with off-chain metadata
 */
export interface JobDisplay extends Job {
  company?: string;                     // Company name (off-chain)
  location?: string;                    // Job location (off-chain)
  type?: string;                        // Job type: full-time, part-time, contract (off-chain)
  category?: string;                    // Job category: Engineering, Design, etc (off-chain)
  tags?: string[];                      // Skill tags (off-chain)
  salaryDisplay?: string;               // Formatted salary string for display
  deadlineDisplay?: string;             // Formatted deadline string for display
  postedDate?: string;                  // Human-readable posted date
  companyLogo?: string;                 // Company logo URL (off-chain)
}

/**
 * Filter options for job search
 */
export interface JobFilters {
  search?: string;                      // Search term for title, company, description
  category?: string;                    // Filter by category
  type?: string;                        // Filter by job type
  location?: string;                    // Filter by location
  minSalary?: number;                   // Minimum salary filter
  maxSalary?: number;                   // Maximum salary filter
  isActive?: boolean;                   // Show only active jobs
}

/**
 * User application with enriched data
 */
export interface UserApplication extends ApplicationProfile {
  job?: JobDisplay;                     // Enriched job data
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';  // Application status
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
