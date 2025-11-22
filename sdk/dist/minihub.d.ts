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
export declare class MiniHubSDK {
    private client;
    private config;
    constructor(client: SuiClient, config: PackageConfig);
    /**
     * JobBoard objesini getirir
     */
    getJobBoard(): Promise<JobBoard | null>;
    /**
     * Belirli bir iş ilanını getirir
     */
    getJob(jobId: string): Promise<Job | null>;
    /**
     * Tüm iş ilanlarını getirir
     */
    getAllJobs(): Promise<Job[]>;
    /**
     * Aktif iş ilanlarını getirir
     */
    getActiveJobs(): Promise<Job[]>;
    /**
     * Belirli bir işverene ait iş ilanlarını getirir
     */
    getJobsByEmployer(employerAddress: string): Promise<Job[]>;
    /**
     * Kullanıcı profilini getirir
     */
    getUserProfile(profileId: string): Promise<UserProfile | null>;
    /**
     * İşveren profilini getirir
     */
    getEmployerProfile(profileId: string): Promise<EmployerProfile | null>;
    /**
     * UserRegistry objesini getirir
     */
    getUserRegistry(): Promise<UserRegistry | null>;
    /**
     * EmployerRegistry objesini getirir
     */
    getEmployerRegistry(): Promise<EmployerRegistry | null>;
    /**
     * Tüm kullanıcı profillerini getirir
     */
    getAllUserProfiles(): Promise<UserProfile[]>;
    /**
     * Tüm işveren profillerini getirir
     */
    getAllEmployerProfiles(): Promise<EmployerProfile[]>;
    /**
     * Belirli bir kullanıcıya ait profili adresle getirir
     */
    getUserProfileByAddress(userAddress: string): Promise<UserProfile | null>;
    /**
     * Belirli bir işverene ait profili adresle getirir
     */
    getEmployerProfileByAddress(employerAddress: string): Promise<EmployerProfile | null>;
    /**
     * Bir kullanıcının sahip olduğu EmployerCap'leri getirir
     */
    getEmployerCaps(ownerAddress: string): Promise<EmployerCap[]>;
    /**
     * Bir işe yapılan belirli bir başvuruyu getirir
     */
    getApplication(jobId: string, candidateAddress: string, index: number): Promise<ApplicationProfile | null>;
    /**
     * Bir işe yapılan tüm başvuruları getirir
     */
    getJobApplications(jobId: string): Promise<ApplicationProfile[]>;
    /**
     * Yeni bir iş ilanı oluşturur (Transaction Block döndürür)
     */
    createPostJobTransaction(params: {
        employerProfileId: string;
        title: string;
        description: string;
        salary?: number;
        deadline: number;
    }): Transaction;
    /**
     * Bir işe başvuru yapar (Transaction Block döndürür)
     */
    createApplyToJobTransaction(params: {
        jobId: string;
        userProfileId: string;
        coverMessage: string;
        cvUrl: string;
    }): Transaction;
    /**
     * Bir adayı işe alır (Transaction Block döndürür)
     */
    createHireCandidateTransaction(params: {
        jobId: string;
        employerCapId: string;
        candidateAddress: string;
        candidateIndex: number;
    }): Transaction;
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
    }): Transaction;
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
    }): Transaction;
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
    }): Transaction;
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
    }): Transaction;
    /**
     * İş ilanının son başvuru tarihinin geçip geçmediğini kontrol eder
     */
    isJobDeadlinePassed(job: Job): boolean;
    /**
     * İş ilanının aktif olup olmadığını kontrol eder
     */
    isJobActive(job: Job): boolean;
    /**
     * Maaş bilgisini formatlar
     */
    formatSalary(salary?: number): string;
    /**
     * Timestamp'i okunabilir tarihe çevirir
     */
    formatTimestamp(timestamp: number): string;
    /**
     * Süre farkını hesaplar (örn: "2 gün önce")
     */
    getRelativeTime(timestamp: number): string;
    /**
     * Son başvuru tarihine kalan süreyi hesaplar
     */
    getTimeUntilDeadline(deadline: number): string;
    /**
     * İş ilanlarını başvuru sayısına göre sıralar
     */
    sortJobsByApplicationCount(jobs: Job[], ascending?: boolean): Job[];
    /**
     * İş ilanlarını tarihe göre sıralar
     */
    sortJobsByDeadline(jobs: Job[], ascending?: boolean): Job[];
    /**
     * İş ilanlarını maaşa göre filtreler
     */
    filterJobsBySalaryRange(jobs: Job[], minSalary?: number, maxSalary?: number): Job[];
    /**
     * İş ilanlarını başlık veya açıklamaya göre arar
     */
    searchJobs(jobs: Job[], query: string): Job[];
    /**
     * Kullanıcı profillerini yeteneklere göre arar
     */
    searchUserProfilesBySkills(profiles: UserProfile[], skills: string[]): UserProfile[];
    /**
     * İşveren profillerini sektöre göre filtreler
     */
    filterEmployersByIndustry(profiles: EmployerProfile[], industry: string): EmployerProfile[];
    /**
     * İstatistik hesaplar
     */
    getStatistics(): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        totalUsers: number;
        totalEmployers: number;
        filledJobs: number;
    }>;
    /**
     * Event'leri dinler ve parse eder
     */
    getEvents(params: {
        eventType: string;
        limit?: number;
        cursor?: string | null;
    }): Promise<any[]>;
    /**
     * Tüm iş ilanı olaylarını getirir
     */
    getJobPostedEvents(limit?: number): Promise<JobPostedEvent[]>;
    /**
     * Tüm başvuru olaylarını getirir
     */
    getApplicationSubmittedEvents(limit?: number): Promise<ApplicationSubmittedEvent[]>;
    /**
     * Tüm işe alma olaylarını getirir
     */
    getCandidateHiredEvents(limit?: number): Promise<CandidateHiredEvent[]>;
    /**
     * Kullanıcının bir işe başvurup başvurmadığını kontrol eder
     */
    hasUserAppliedToJob(jobId: string, userAddress: string): Promise<boolean>;
    /**
     * Kullanıcının tüm başvurularını getirir
     */
    getUserApplications(userAddress: string): Promise<ApplicationProfile[]>;
    /**
     * Validasyon: İş ilanı oluşturma parametrelerini kontrol eder
     */
    validatePostJobParams(params: {
        title: string;
        description: string;
        deadline: number;
    }): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validasyon: Profil oluşturma parametrelerini kontrol eder
     */
    validateUserProfileParams(params: {
        name: string;
        bio: string;
        experienceYears: number;
    }): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * MiniHubSDK instance'ı oluşturur
 */
export declare function createMiniHubSDK(client: SuiClient, config: PackageConfig): MiniHubSDK;
/**
 * Varsayılan Clock objesi ID'si (Sui mainnet/testnet)
 */
export declare const DEFAULT_CLOCK_ID = "0x6";
/**
 * Paket tipleri
 */
export declare const MODULE_NAME = "minihub";
/**
 * Error kodları
 */
export declare enum ErrorCode {
    NOT_AUTHORIZED = 1,
    JOB_ALREADY_FILLED = 2,
    INVALID_APPLICATION = 3,
    DEADLINE_PASSED = 4
}
/**
 * Error mesajları
 */
export declare const ERROR_MESSAGES: Record<ErrorCode, string>;
export default MiniHubSDK;
//# sourceMappingURL=minihub.d.ts.map