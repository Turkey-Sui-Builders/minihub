import type { 
  JobDisplay, 
  JobBoard, 
  ApplicationProfile,
  JobFilters,
  ApiResponse,
} from '../types';

// Backend API base URL - update this with your actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Service for interacting with the backend
 */
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
          message: data.message,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ====== Job Endpoints ======

  /**
   * Get all jobs with optional filters
   */
  async getJobs(filters?: JobFilters): Promise<ApiResponse<JobDisplay[]>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.minSalary) params.append('minSalary', filters.minSalary.toString());
    if (filters?.maxSalary) params.append('maxSalary', filters.maxSalary.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';

    return this.fetch<JobDisplay[]>(endpoint);
  }

  /**
   * Get a single job by ID
   */
  async getJob(jobId: string): Promise<ApiResponse<JobDisplay>> {
    return this.fetch<JobDisplay>(`/jobs/${jobId}`);
  }

  /**
   * Get jobs posted by a specific employer
   */
  async getJobsByEmployer(employerAddress: string): Promise<ApiResponse<JobDisplay[]>> {
    return this.fetch<JobDisplay[]>(`/jobs/employer/${employerAddress}`);
  }

  /**
   * Get the JobBoard metadata
   */
  async getJobBoard(): Promise<ApiResponse<JobBoard>> {
    return this.fetch<JobBoard>('/job-board');
  }

  // ====== Application Endpoints ======

  /**
   * Get applications for a specific job (employer only)
   */
  async getJobApplications(
    jobId: string,
    walletAddress: string,
    signature: string
  ): Promise<ApiResponse<ApplicationProfile[]>> {
    return this.fetch<ApplicationProfile[]>(`/jobs/${jobId}/applications`, {
      headers: {
        'X-Wallet-Address': walletAddress,
        'X-Signature': signature,
      },
    });
  }

  /**
   * Get all applications by a candidate
   */
  async getCandidateApplications(
    candidateAddress: string
  ): Promise<ApiResponse<ApplicationProfile[]>> {
    return this.fetch<ApplicationProfile[]>(`/applications/candidate/${candidateAddress}`);
  }

  /**
   * Get a specific application by ID
   */
  async getApplication(applicationId: string): Promise<ApiResponse<ApplicationProfile>> {
    return this.fetch<ApplicationProfile>(`/applications/${applicationId}`);
  }

  /**
   * Submit a new application (this would typically trigger a blockchain transaction)
   */
  async submitApplication(
    jobId: string,
    coverMessage: string,
    cvUrl: string,
    walletAddress: string,
    signature: string
  ): Promise<ApiResponse<{ applicationId: string; transaction: string }>> {
    return this.fetch<{ applicationId: string; transaction: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        coverMessage,
        cvUrl,
      }),
      headers: {
        'X-Wallet-Address': walletAddress,
        'X-Signature': signature,
      },
    });
  }

  // ====== Event Endpoints ======

  /**
   * Get recent job board events
   */
  async getEvents(
    eventType?: 'JobPosted' | 'ApplicationSubmitted' | 'CandidateHired',
    limit: number = 50
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (eventType) params.append('type', eventType);
    params.append('limit', limit.toString());

    return this.fetch<any[]>(`/events?${params.toString()}`);
  }

  // ====== Stats Endpoints ======

  /**
   * Get platform statistics
   */
  async getStats(): Promise<ApiResponse<{
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalHired: number;
  }>> {
    return this.fetch('/stats');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing or custom instances
export default ApiService;
