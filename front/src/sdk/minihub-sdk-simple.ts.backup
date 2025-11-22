/**
 * MiniHub SDK - Decentralized Job Board on Sui
 * 
 * Bu SDK, MiniHub akıllı kontratı ile etkileşim için gerekli tüm fonksiyonları sağlar.
 * React uygulamalarında kullanım için optimize edilmiştir.
 * 
 * @module minihub-sdk
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

// ====== Types ======

export interface PackageConfig {
  packageId: string;
  jobBoardId: string;
  userRegistryId: string;
  employerRegistryId: string;
  clockId: string;
}

export interface Job {
  id: string;
  employer: string;
  employerProfileId: string;
  title: string;
  description: string;
  salary?: number;
  applicationCount: number;
  hiredCandidate?: string;
  isActive: boolean;
  deadline: number;
}

export interface ApplicationProfile {
  id: string;
  candidate: string;
  userProfileId: string;
  jobId: string;
  coverMessage: string;
  timestamp: number;
  cvUrl: string;
}

export interface UserProfile {
  id: string;
  userAddress: string;
  name: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
  experienceYears: number;
  portfolioUrl: string;
  createdAt: number;
  updatedAt: number;
}

export interface EmployerProfile {
  id: string;
  employerAddress: string;
  companyName: string;
  description: string;
  logoUrl: string;
  website: string;
  industry: string;
  employeeCount: number;
  foundedYear: number;
  createdAt: number;
  updatedAt: number;
}

export interface JobBoard {
  id: string;
  jobCount: number;
  jobIds: string[];
}

// ====== SDK Class ======

export class MiniHubSDK {
  private client: SuiClient;
  private config: PackageConfig;

  constructor(client: SuiClient, config: PackageConfig) {
    this.client = client;
    this.config = config;
  }

  // ====== Getter Functions ======

  /**
   * Get JobBoard object
   */
  async getJobBoard(): Promise<JobBoard | null> {
    try {
      const object = await this.client.getObject({
        id: this.config.jobBoardId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        jobCount: Number(fields.job_count),
        jobIds: fields.job_ids || [],
      };
    } catch (error) {
      console.error('Error fetching JobBoard:', error);
      return null;
    }
  }

  /**
   * Get specific job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const object = await this.client.getObject({
        id: jobId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        employer: fields.employer,
        employerProfileId: fields.employer_profile_id,
        title: fields.title,
        description: fields.description,
        salary: fields.salary ? Number(fields.salary) : undefined,
        applicationCount: Number(fields.application_count),
        hiredCandidate: fields.hired_candidate || undefined,
        isActive: fields.is_active,
        deadline: Number(fields.deadline),
      };
    } catch (error) {
      console.error('Error fetching Job:', error);
      return null;
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs(): Promise<Job[]> {
    try {
      const jobBoard = await this.getJobBoard();
      if (!jobBoard || jobBoard.jobIds.length === 0) {
        return [];
      }

      const jobs = await Promise.all(
        jobBoard.jobIds.map(jobId => this.getJob(jobId))
      );

      return jobs.filter((job): job is Job => job !== null);
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      return [];
    }
  }

  /**
   * Get active jobs only
   */
  async getActiveJobs(): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    return allJobs.filter(job => job.isActive && !job.hiredCandidate);
  }

  /**
   * Get jobs by employer address
   */
  async getJobsByEmployer(employerAddress: string): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    return allJobs.filter(job => job.employer === employerAddress);
  }

  /**
   * Get user profile
   */
  async getUserProfile(profileId: string): Promise<UserProfile | null> {
    try {
      const object = await this.client.getObject({
        id: profileId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        userAddress: fields.user_address,
        name: fields.name,
        bio: fields.bio,
        avatarUrl: fields.avatar_url,
        skills: fields.skills || [],
        experienceYears: Number(fields.experience_years),
        portfolioUrl: fields.portfolio_url,
        createdAt: Number(fields.created_at),
        updatedAt: Number(fields.updated_at),
      };
    } catch (error) {
      console.error('Error fetching UserProfile:', error);
      return null;
    }
  }

  /**
   * Get employer profile
   */
  async getEmployerProfile(profileId: string): Promise<EmployerProfile | null> {
    try {
      const object = await this.client.getObject({
        id: profileId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        employerAddress: fields.employer_address,
        companyName: fields.company_name,
        description: fields.description,
        logoUrl: fields.logo_url,
        website: fields.website,
        industry: fields.industry,
        employeeCount: Number(fields.employee_count),
        foundedYear: Number(fields.founded_year),
        createdAt: Number(fields.created_at),
        updatedAt: Number(fields.updated_at),
      };
    } catch (error) {
      console.error('Error fetching EmployerProfile:', error);
      return null;
    }
  }

  /**
   * Get application profile
   */
  async getApplicationProfile(applicationId: string): Promise<ApplicationProfile | null> {
    try {
      const object = await this.client.getObject({
        id: applicationId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        candidate: fields.candidate,
        userProfileId: fields.user_profile_id,
        jobId: fields.job_id,
        coverMessage: fields.cover_message,
        timestamp: Number(fields.timestamp),
        cvUrl: fields.cv_url,
      };
    } catch (error) {
      console.error('Error fetching ApplicationProfile:', error);
      return null;
    }
  }

  /**
   * Get user profile by address
   */
  async getUserProfileByAddress(userAddress: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 SDK: Searching for UserProfile for address:', userAddress);
      
      // Get the UserRegistry object
      console.log('🔍 SDK: Fetching UserRegistry object:', this.config.userRegistryId);
      const registryObj = await this.client.getObject({
        id: this.config.userRegistryId,
        options: { showContent: true },
      });

      console.log('📦 SDK: UserRegistry object:', registryObj);

      if (registryObj.data && registryObj.data.content && registryObj.data.content.dataType === 'moveObject') {
        const fields = registryObj.data.content.fields as any;
        console.log('📝 SDK: UserRegistry fields:', fields);
        
        // Profiles are stored in user_profiles array
        if (fields.user_profiles && Array.isArray(fields.user_profiles)) {
          console.log('📋 SDK: Found', fields.user_profiles.length, 'profiles in array');
          
          // Each entry in the array is an object ID - fetch each one
          for (const profileId of fields.user_profiles) {
            console.log('🔍 SDK: Checking profile:', profileId);
            
            try {
              const profileObj = await this.client.getObject({
                id: profileId,
                options: { showContent: true },
              });

              if (profileObj.data && profileObj.data.content && profileObj.data.content.dataType === 'moveObject') {
                const profileFields = profileObj.data.content.fields as any;
                console.log('📝 SDK: Profile fields:', profileFields);
                
                // Check if this profile belongs to our address
                if (profileFields.user_address === userAddress) {
                  console.log('✅ SDK: Found matching profile!');
                  
                  const profile = {
                    id: profileFields.id?.id || profileObj.data.objectId,
                    userAddress: profileFields.user_address,
                    name: profileFields.name || '',
                    bio: profileFields.bio || '',
                    avatarUrl: profileFields.avatar_url || '',
                    skills: profileFields.skills || [],
                    experienceYears: Number(profileFields.experience_years || 0),
                    portfolioUrl: profileFields.portfolio_url || '',
                    createdAt: Number(profileFields.created_at || 0),
                    updatedAt: Number(profileFields.updated_at || 0),
                  };
                  
                  console.log('✅ SDK: Returning profile:', profile);
                  return profile;
                }
              }
            } catch (err) {
              console.log('⚠️ SDK: Error fetching profile object:', err);
            }
          }
        }
      }

      console.log('❌ SDK: No profile found for address');
      return null;
    } catch (error) {
      console.error('❌ SDK: Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get employer profile by address
   */
  async getEmployerProfileByAddress(employerAddress: string): Promise<EmployerProfile | null> {
    try {
      // Get all owned objects for the employer
      const objects = await this.client.getOwnedObjects({
        owner: employerAddress,
        filter: {
          StructType: `${this.config.packageId}::minihub::EmployerProfile`,
        },
        options: { showContent: true },
      });

      if (objects.data.length === 0) {
        return null;
      }

      // Get the first (should be only) employer profile
      const profileObj = objects.data[0];
      if (!profileObj.data || !profileObj.data.content || profileObj.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = profileObj.data.content.fields as any;
      return {
        id: fields.id.id,
        employerAddress: fields.employer_address,
        companyName: fields.company_name,
        description: fields.description,
        logoUrl: fields.logo_url,
        website: fields.website,
        industry: fields.industry,
        employeeCount: Number(fields.employee_count),
        foundedYear: Number(fields.founded_year),
        createdAt: Number(fields.created_at),
        updatedAt: Number(fields.updated_at),
      };
    } catch (error) {
      console.error('Error fetching employer profile by address:', error);
      return null;
    }
  }

  // ====== Transaction Builders ======

  /**
   * Create user profile
   */
  createUserProfileTransaction(params: {
    name: string;
    bio: string;
    avatarUrl: string;
    skills: string[];
    experienceYears: number;
    portfolioUrl: string;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::create_user_profile`,
      arguments: [
        tx.object(this.config.userRegistryId),
        tx.pure.string(params.name),
        tx.pure.string(params.bio),
        tx.pure.string(params.avatarUrl),
        tx.pure.vector('string', params.skills),
        tx.pure.u64(params.experienceYears),
        tx.pure.string(params.portfolioUrl),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Update user profile
   */
  createUpdateUserProfileTransaction(params: {
    userProfileId: string;
    name: string;
    bio: string;
    avatarUrl: string;
    skills: string[];
    experienceYears: number;
    portfolioUrl: string;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::update_user_profile`,
      arguments: [
        tx.object(params.userProfileId),
        tx.pure.string(params.name),
        tx.pure.string(params.bio),
        tx.pure.string(params.avatarUrl),
        tx.pure.vector('string', params.skills),
        tx.pure.u64(params.experienceYears),
        tx.pure.string(params.portfolioUrl),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Create employer profile
   */
  createEmployerProfileTransaction(params: {
    companyName: string;
    description: string;
    logoUrl: string;
    website: string;
    industry: string;
    employeeCount: number;
    foundedYear: number;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::create_employer_profile`,
      arguments: [
        tx.object(this.config.employerRegistryId),
        tx.pure.string(params.companyName),
        tx.pure.string(params.description),
        tx.pure.string(params.logoUrl),
        tx.pure.string(params.website),
        tx.pure.string(params.industry),
        tx.pure.u64(params.employeeCount),
        tx.pure.u64(params.foundedYear),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Update employer profile
   */
  createUpdateEmployerProfileTransaction(params: {
    employerProfileId: string;
    companyName: string;
    description: string;
    logoUrl: string;
    website: string;
    industry: string;
    employeeCount: number;
    foundedYear: number;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::update_employer_profile`,
      arguments: [
        tx.object(params.employerProfileId),
        tx.pure.string(params.companyName),
        tx.pure.string(params.description),
        tx.pure.string(params.logoUrl),
        tx.pure.string(params.website),
        tx.pure.string(params.industry),
        tx.pure.u64(params.employeeCount),
        tx.pure.u64(params.foundedYear),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Post a new job
   */
  createPostJobTransaction(params: {
    employerProfileId: string;
    title: string;
    description: string;
    salary?: number;
    deadline: number;
  }): Transaction {
    const tx = new Transaction();

    const salaryArg = params.salary
      ? tx.pure.vector('u64', [params.salary])
      : tx.pure.vector('u64', []);

    tx.moveCall({
      target: `${this.config.packageId}::minihub::post_job`,
      arguments: [
        tx.object(this.config.jobBoardId),
        tx.object(params.employerProfileId),
        tx.pure.string(params.title),
        tx.pure.string(params.description),
        salaryArg,
        tx.pure.u64(params.deadline),
      ],
    });

    return tx;
  }

  /**
   * Apply to a job
   */
  createApplyToJobTransaction(params: {
    jobId: string;
    userProfileId: string;
    coverMessage: string;
    cvUrl: string;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::apply_to_job`,
      arguments: [
        tx.object(params.jobId),
        tx.object(params.userProfileId),
        tx.pure.string(params.coverMessage),
        tx.pure.string(params.cvUrl),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Hire a candidate
   */
  createHireCandidateTransaction(params: {
    jobId: string;
    employerCapId: string;
    candidateAddress: string;
    candidateIndex: number;
  }): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::minihub::hire_candidate`,
      arguments: [
        tx.object(params.jobId),
        tx.object(params.employerCapId),
        tx.pure.address(params.candidateAddress),
        tx.pure.u64(params.candidateIndex),
      ],
    });

    return tx;
  }
}
