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
// ====== Tipler ======

/**
 * Paket yapılandırması
 */
export interface PackageConfig {
  packageId: string;
  jobBoardId: string;
  userRegistryId: string;
  employerRegistryId: string;
  clockId: string;
}

/**
 * İş ilanı yapısı
 */
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

/**
 * Başvuru profili yapısı
 */
export interface ApplicationProfile {
  id: string;
  candidate: string;
  userProfileId: string;
  jobId: string;
  coverMessage: string;
  timestamp: number;
  cvUrl: string;
}

/**
 * Kullanıcı profili yapısı
 */
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

/**
 * İşveren profili yapısı
 */
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

/**
 * JobBoard yapısı
 */
export interface JobBoard {
  id: string;
  jobCount: number;
  jobIds: string[];
}

/**
 * UserRegistry yapısı
 */
export interface UserRegistry {
  id: string;
  userProfiles: string[];
  userCount: number;
}

/**
 * EmployerRegistry yapısı
 */
export interface EmployerRegistry {
  id: string;
  employerProfiles: string[];
  employerCount: number;
}

/**
 * İşveren yetki nesnesi
 */
export interface EmployerCap {
  id: string;
  jobId: string;
}

// ====== Event Types ======
// ====== Olay Tipleri ======

export interface JobPostedEvent {
  jobId: string;
  employer: string;
  title: string;
  hasSalary: boolean;
  deadline: number;
}

export interface ApplicationSubmittedEvent {
  jobId: string;
  candidate: string;
  timestamp: number;
  applicationId: string;
}

export interface CandidateHiredEvent {
  jobId: string;
  employer: string;
  candidate: string;
}

export interface UserProfileCreatedEvent {
  userProfileId: string;
  userAddress: string;
  name: string;
}

export interface EmployerProfileCreatedEvent {
  employerProfileId: string;
  employerAddress: string;
  companyName: string;
}

export interface ProfileUpdatedEvent {
  profileId: string;
  profileType: string;
  updatedAt: number;
}

// ====== SDK Class ======
// ====== SDK Sınıfı ======

export class MiniHubSDK {
  private client: SuiClient;
  private config: PackageConfig;

  constructor(client: SuiClient, config: PackageConfig) {
    this.client = client;
    this.config = config;
  }

  // ====== Getter Functions ======
  // ====== Veri Okuma Fonksiyonları ======

  /**
   * JobBoard objesini getirir
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
   * Belirli bir iş ilanını getirir
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
   * Tüm iş ilanlarını getirir
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
   * Aktif iş ilanlarını getirir
   */
  async getActiveJobs(): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    return allJobs.filter(job => job.isActive && !job.hiredCandidate);
  }

  /**
   * Belirli bir işverene ait iş ilanlarını getirir
   */
  async getJobsByEmployer(employerAddress: string): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    return allJobs.filter(job => job.employer === employerAddress);
  }

  /**
   * Kullanıcı profilini getirir
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
   * İşveren profilini getirir
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
   * UserRegistry objesini getirir
   */
  async getUserRegistry(): Promise<UserRegistry | null> {
    try {
      const object = await this.client.getObject({
        id: this.config.userRegistryId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        userProfiles: fields.user_profiles || [],
        userCount: Number(fields.user_count),
      };
    } catch (error) {
      console.error('Error fetching UserRegistry:', error);
      return null;
    }
  }

  /**
   * EmployerRegistry objesini getirir
   */
  async getEmployerRegistry(): Promise<EmployerRegistry | null> {
    try {
      const object = await this.client.getObject({
        id: this.config.employerRegistryId,
        options: { showContent: true },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;
      return {
        id: fields.id.id,
        employerProfiles: fields.employer_profiles || [],
        employerCount: Number(fields.employer_count),
      };
    } catch (error) {
      console.error('Error fetching EmployerRegistry:', error);
      return null;
    }
  }

  /**
   * Tüm kullanıcı profillerini getirir
   */
  async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      const registry = await this.getUserRegistry();
      if (!registry || registry.userProfiles.length === 0) {
        return [];
      }

      const profiles = await Promise.all(
        registry.userProfiles.map(profileId => this.getUserProfile(profileId))
      );

      return profiles.filter((profile): profile is UserProfile => profile !== null);
    } catch (error) {
      console.error('Error fetching all user profiles:', error);
      return [];
    }
  }

  /**
   * Tüm işveren profillerini getirir
   */
  async getAllEmployerProfiles(): Promise<EmployerProfile[]> {
    try {
      const registry = await this.getEmployerRegistry();
      if (!registry || registry.employerProfiles.length === 0) {
        return [];
      }

      const profiles = await Promise.all(
        registry.employerProfiles.map(profileId => this.getEmployerProfile(profileId))
      );

      return profiles.filter((profile): profile is EmployerProfile => profile !== null);
    } catch (error) {
      console.error('Error fetching all employer profiles:', error);
      return [];
    }
  }

  /**
   * Belirli bir kullanıcıya ait profili adresle getirir
   */
  async getUserProfileByAddress(userAddress: string): Promise<UserProfile | null> {
    const allProfiles = await this.getAllUserProfiles();
    return allProfiles.find(profile => profile.userAddress === userAddress) || null;
  }

  /**
   * Belirli bir işverene ait profili adresle getirir
   */
  async getEmployerProfileByAddress(employerAddress: string): Promise<EmployerProfile | null> {
    const allProfiles = await this.getAllEmployerProfiles();
    return allProfiles.find(profile => profile.employerAddress === employerAddress) || null;
  }

  /**
   * Bir kullanıcının sahip olduğu EmployerCap'leri getirir
   */
  async getEmployerCaps(ownerAddress: string): Promise<EmployerCap[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: ownerAddress,
        filter: {
          StructType: `${this.config.packageId}::minihub::EmployerCap`,
        },
        options: { showContent: true },
      });

      const caps: EmployerCap[] = [];
      for (const obj of objects.data) {
        if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any;
          caps.push({
            id: fields.id.id,
            jobId: fields.job_id,
          });
        }
      }

      return caps;
    } catch (error) {
      console.error('Error fetching EmployerCaps:', error);
      return [];
    }
  }

  /**
   * Bir işe yapılan belirli bir başvuruyu getirir
   */
  async getApplication(
    jobId: string,
    candidateAddress: string,
    index: number
  ): Promise<ApplicationProfile | null> {
    try {
      // Dynamic field olarak saklandığı için özel bir sorgu gerekir
      const job = await this.client.getObject({
        id: jobId,
        options: { showContent: true },
      });

      if (!job.data) return null;

      // Dynamic fields'ı getir
      const dynamicFields = await this.client.getDynamicFields({
        parentId: jobId,
      });

      // İlgili başvuruyu bul
      for (const field of dynamicFields.data) {
        const fieldObject = await this.client.getObject({
          id: field.objectId,
          options: { showContent: true },
        });

        if (
          fieldObject.data &&
          fieldObject.data.content &&
          fieldObject.data.content.dataType === 'moveObject'
        ) {
          const fields = fieldObject.data.content.fields as any;
          if (fields.candidate === candidateAddress) {
            return {
              id: fields.id.id,
              candidate: fields.candidate,
              userProfileId: fields.user_profile_id,
              jobId: fields.job_id,
              coverMessage: fields.cover_message,
              timestamp: Number(fields.timestamp),
              cvUrl: fields.cv_url,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching application:', error);
      return null;
    }
  }

  /**
   * Bir işe yapılan tüm başvuruları getirir
   */
  async getJobApplications(jobId: string): Promise<ApplicationProfile[]> {
    try {
      const dynamicFields = await this.client.getDynamicFields({
        parentId: jobId,
      });

      const applications: ApplicationProfile[] = [];

      for (const field of dynamicFields.data) {
        const fieldObject = await this.client.getObject({
          id: field.objectId,
          options: { showContent: true },
        });

        if (
          fieldObject.data &&
          fieldObject.data.content &&
          fieldObject.data.content.dataType === 'moveObject'
        ) {
          const fields = fieldObject.data.content.fields as any;
          applications.push({
            id: fields.id.id,
            candidate: fields.candidate,
            userProfileId: fields.user_profile_id,
            jobId: fields.job_id,
            coverMessage: fields.cover_message,
            timestamp: Number(fields.timestamp),
            cvUrl: fields.cv_url,
          });
        }
      }

      return applications;
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return [];
    }
  }

  // ====== Transaction Functions ======
  // ====== İşlem Fonksiyonları ======

  /**
   * Yeni bir iş ilanı oluşturur (Transaction Block döndürür)
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
      ? tx.pure([params.salary], 'vector<u64>')
      : tx.pure([], 'vector<u64>');

    tx.moveCall({
      target: `${this.config.packageId}::minihub::post_job`,
      arguments: [
        tx.object(this.config.jobBoardId),
        tx.object(params.employerProfileId),
        tx.pure(params.title, 'string'),
        tx.pure(params.description, 'string'),
        salaryArg,
        tx.pure(params.deadline, 'u64'),
      ],
    });

    return tx;
  }

  /**
   * Bir işe başvuru yapar (Transaction Block döndürür)
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
        tx.pure(params.coverMessage, 'string'),
        tx.pure(params.cvUrl, 'string'),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Bir adayı işe alır (Transaction Block döndürür)
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
        tx.pure(params.candidateAddress, 'address'),
        tx.pure(params.candidateIndex, 'u64'),
      ],
    });

    return tx;
  }

  /**
   * Yeni kullanıcı profili oluşturur (Transaction Block döndürür)
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
        tx.pure(params.name, 'string'),
        tx.pure(params.bio, 'string'),
        tx.pure(params.avatarUrl, 'string'),
        tx.pure(params.skills, 'vector<string>'),
        tx.pure(params.experienceYears, 'u64'),
        tx.pure(params.portfolioUrl, 'string'),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Yeni işveren profili oluşturur (Transaction Block döndürür)
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
        tx.pure(params.companyName, 'string'),
        tx.pure(params.description, 'string'),
        tx.pure(params.logoUrl, 'string'),
        tx.pure(params.website, 'string'),
        tx.pure(params.industry, 'string'),
        tx.pure(params.employeeCount, 'u64'),
        tx.pure(params.foundedYear, 'u64'),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * Kullanıcı profilini günceller (Transaction Block döndürür)
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
        tx.pure(params.name, 'string'),
        tx.pure(params.bio, 'string'),
        tx.pure(params.avatarUrl, 'string'),
        tx.pure(params.skills, 'vector<string>'),
        tx.pure(params.experienceYears, 'u64'),
        tx.pure(params.portfolioUrl, 'string'),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  /**
   * İşveren profilini günceller (Transaction Block döndürür)
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
        tx.pure(params.companyName, 'string'),
        tx.pure(params.description, 'string'),
        tx.pure(params.logoUrl, 'string'),
        tx.pure(params.website, 'string'),
        tx.pure(params.industry, 'string'),
        tx.pure(params.employeeCount, 'u64'),
        tx.pure(params.foundedYear, 'u64'),
        tx.object(this.config.clockId),
      ],
    });

    return tx;
  }

  // ====== Helper Functions ======
  // ====== Yardımcı Fonksiyonlar ======

  /**
   * İş ilanının son başvuru tarihinin geçip geçmediğini kontrol eder
   */
  isJobDeadlinePassed(job: Job): boolean {
    return Date.now() > job.deadline;
  }

  /**
   * İş ilanının aktif olup olmadığını kontrol eder
   */
  isJobActive(job: Job): boolean {
    return job.isActive && !job.hiredCandidate && !this.isJobDeadlinePassed(job);
  }

  /**
   * Maaş bilgisini formatlar
   */
  formatSalary(salary?: number): string {
    if (!salary) return 'Belirtilmemiş';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(salary);
  }

  /**
   * Timestamp'i okunabilir tarihe çevirir
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Süre farkını hesaplar (örn: "2 gün önce")
   */
  getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} yıl önce`;
    if (months > 0) return `${months} ay önce`;
    if (weeks > 0) return `${weeks} hafta önce`;
    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  }

  /**
   * Son başvuru tarihine kalan süreyi hesaplar
   */
  getTimeUntilDeadline(deadline: number): string {
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return 'Süresi dolmuş';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months} ay`;
    if (weeks > 0) return `${weeks} hafta`;
    if (days > 0) return `${days} gün`;
    if (hours > 0) return `${hours} saat`;
    if (minutes > 0) return `${minutes} dakika`;
    return `${seconds} saniye`;
  }

  /**
   * İş ilanlarını başvuru sayısına göre sıralar
   */
  sortJobsByApplicationCount(jobs: Job[], ascending: boolean = false): Job[] {
    return [...jobs].sort((a, b) => {
      return ascending
        ? a.applicationCount - b.applicationCount
        : b.applicationCount - a.applicationCount;
    });
  }

  /**
   * İş ilanlarını tarihe göre sıralar
   */
  sortJobsByDeadline(jobs: Job[], ascending: boolean = true): Job[] {
    return [...jobs].sort((a, b) => {
      return ascending ? a.deadline - b.deadline : b.deadline - a.deadline;
    });
  }

  /**
   * İş ilanlarını maaşa göre filtreler
   */
  filterJobsBySalaryRange(
    jobs: Job[],
    minSalary?: number,
    maxSalary?: number
  ): Job[] {
    return jobs.filter(job => {
      if (!job.salary) return false;
      if (minSalary && job.salary < minSalary) return false;
      if (maxSalary && job.salary > maxSalary) return false;
      return true;
    });
  }

  /**
   * İş ilanlarını başlık veya açıklamaya göre arar
   */
  searchJobs(jobs: Job[], query: string): Job[] {
    const lowerQuery = query.toLowerCase();
    return jobs.filter(
      job =>
        job.title.toLowerCase().includes(lowerQuery) ||
        job.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Kullanıcı profillerini yeteneklere göre arar
   */
  searchUserProfilesBySkills(
    profiles: UserProfile[],
    skills: string[]
  ): UserProfile[] {
    const lowerSkills = skills.map(s => s.toLowerCase());
    return profiles.filter(profile =>
      profile.skills.some(skill =>
        lowerSkills.some(s => skill.toLowerCase().includes(s))
      )
    );
  }

  /**
   * İşveren profillerini sektöre göre filtreler
   */
  filterEmployersByIndustry(
    profiles: EmployerProfile[],
    industry: string
  ): EmployerProfile[] {
    const lowerIndustry = industry.toLowerCase();
    return profiles.filter(profile =>
      profile.industry.toLowerCase().includes(lowerIndustry)
    );
  }

  /**
   * İstatistik hesaplar
   */
  async getStatistics(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalUsers: number;
    totalEmployers: number;
    filledJobs: number;
  }> {
    const [jobBoard, userRegistry, employerRegistry, allJobs] = await Promise.all([
      this.getJobBoard(),
      this.getUserRegistry(),
      this.getEmployerRegistry(),
      this.getAllJobs(),
    ]);

    const activeJobs = allJobs.filter(job => this.isJobActive(job)).length;
    const filledJobs = allJobs.filter(job => job.hiredCandidate).length;
    const totalApplications = allJobs.reduce(
      (sum, job) => sum + job.applicationCount,
      0
    );

    return {
      totalJobs: jobBoard?.jobCount || 0,
      activeJobs,
      totalApplications,
      totalUsers: userRegistry?.userCount || 0,
      totalEmployers: employerRegistry?.employerCount || 0,
      filledJobs,
    };
  }

  /**
   * Event'leri dinler ve parse eder
   */
  async getEvents(params: {
    eventType: string;
    limit?: number;
    cursor?: string;
  }): Promise<any[]> {
    try {
      const { data } = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.config.packageId}::minihub::${params.eventType}`,
        },
        limit: params.limit,
        cursor: params.cursor,
      });

      return data.map((event: any) => event.parsedJson);
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Tüm iş ilanı olaylarını getirir
   */
  async getJobPostedEvents(limit?: number): Promise<JobPostedEvent[]> {
    return this.getEvents({ eventType: 'JobPosted', limit });
  }

  /**
   * Tüm başvuru olaylarını getirir
   */
  async getApplicationSubmittedEvents(
    limit?: number
  ): Promise<ApplicationSubmittedEvent[]> {
    return this.getEvents({ eventType: 'ApplicationSubmitted', limit });
  }

  /**
   * Tüm işe alma olaylarını getirir
   */
  async getCandidateHiredEvents(limit?: number): Promise<CandidateHiredEvent[]> {
    return this.getEvents({ eventType: 'CandidateHired', limit });
  }

  /**
   * Kullanıcının bir işe başvurup başvurmadığını kontrol eder
   */
  async hasUserAppliedToJob(
    jobId: string,
    userAddress: string
  ): Promise<boolean> {
    const applications = await this.getJobApplications(jobId);
    return applications.some(app => app.candidate === userAddress);
  }

  /**
   * Kullanıcının tüm başvurularını getirir
   */
  async getUserApplications(userAddress: string): Promise<ApplicationProfile[]> {
    const allJobs = await this.getAllJobs();
    const applications: ApplicationProfile[] = [];

    for (const job of allJobs) {
      const jobApplications = await this.getJobApplications(job.id);
      const userApps = jobApplications.filter(
        app => app.candidate === userAddress
      );
      applications.push(...userApps);
    }

    return applications;
  }

  /**
   * Validasyon: İş ilanı oluşturma parametrelerini kontrol eder
   */
  validatePostJobParams(params: {
    title: string;
    description: string;
    deadline: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.title || params.title.trim().length === 0) {
      errors.push('İş başlığı boş olamaz');
    }

    if (params.title.length > 200) {
      errors.push('İş başlığı 200 karakterden uzun olamaz');
    }

    if (!params.description || params.description.trim().length === 0) {
      errors.push('İş açıklaması boş olamaz');
    }

    if (params.deadline <= Date.now()) {
      errors.push('Son başvuru tarihi gelecekte olmalıdır');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validasyon: Profil oluşturma parametrelerini kontrol eder
   */
  validateUserProfileParams(params: {
    name: string;
    bio: string;
    experienceYears: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.name || params.name.trim().length === 0) {
      errors.push('İsim boş olamaz');
    }

    if (params.name.length > 100) {
      errors.push('İsim 100 karakterden uzun olamaz');
    }

    if (!params.bio || params.bio.trim().length === 0) {
      errors.push('Biyografi boş olamaz');
    }

    if (params.experienceYears < 0 || params.experienceYears > 50) {
      errors.push('Tecrübe yılı 0-50 arasında olmalıdır');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ====== Factory Function ======
// ====== Fabrika Fonksiyonu ======

/**
 * MiniHubSDK instance'ı oluşturur
 */
export function createMiniHubSDK(
  client: SuiClient,
  config: PackageConfig
): MiniHubSDK {
  return new MiniHubSDK(client, config);
}

// ====== Constants ======
// ====== Sabitler ======

/**
 * Varsayılan Clock objesi ID'si (Sui mainnet/testnet)
 */
export const DEFAULT_CLOCK_ID = '0x6';

/**
 * Paket tipleri
 */
export const MODULE_NAME = 'minihub';

/**
 * Error kodları
 */
export enum ErrorCode {
  NOT_AUTHORIZED = 1,
  JOB_ALREADY_FILLED = 2,
  INVALID_APPLICATION = 3,
  DEADLINE_PASSED = 4,
}

/**
 * Error mesajları
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NOT_AUTHORIZED]: 'Yetkisiz erişim',
  [ErrorCode.JOB_ALREADY_FILLED]: 'İş pozisyonu zaten dolu',
  [ErrorCode.INVALID_APPLICATION]: 'Geçersiz başvuru',
  [ErrorCode.DEADLINE_PASSED]: 'Son başvuru tarihi geçti',
};

export default MiniHubSDK;