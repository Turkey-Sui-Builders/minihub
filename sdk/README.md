# MiniHub SDK

**Sui blockchain üzerinde merkeziyetsiz iş ilanı platformu MiniHub için React/TypeScript SDK**

## 📋 İçindekiler

- [Kurulum](#-kurulum)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Özellikler](#-özellikler)
- [API Referansı](#-api-referansı)
- [Detaylı Kullanım](#-detaylı-kullanım)

## 📦 Kurulum

```bash
npm install @mysten/sui
# veya
pnpm add @mysten/sui
# veya
yarn add @mysten/sui
```

## 🚀 Hızlı Başlangıç

### 1. SDK'yı Başlatma

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createMiniHubSDK, DEFAULT_CLOCK_ID } from './sdk/minihub';

// Sui client oluştur
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// SDK yapılandırması
const config = {
  packageId: 'YOUR_PACKAGE_ID',
  jobBoardId: 'YOUR_JOB_BOARD_ID',
  userRegistryId: 'YOUR_USER_REGISTRY_ID',
  employerRegistryId: 'YOUR_EMPLOYER_REGISTRY_ID',
  clockId: DEFAULT_CLOCK_ID,
};

// SDK instance oluştur
const miniHub = createMiniHubSDK(client, config);
```

### 2. React Hook ile Kullanım

```typescript
// hooks/useMiniHub.ts
import { useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { createMiniHubSDK, PackageConfig, DEFAULT_CLOCK_ID } from '../sdk/minihub';

export function useMiniHub() {
  const client = useSuiClient();
  
  const sdk = useMemo(() => {
    return createMiniHubSDK(client, {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
      jobBoardId: process.env.NEXT_PUBLIC_JOB_BOARD_ID!,
      userRegistryId: process.env.NEXT_PUBLIC_USER_REGISTRY_ID!,
      employerRegistryId: process.env.NEXT_PUBLIC_EMPLOYER_REGISTRY_ID!,
      clockId: DEFAULT_CLOCK_ID,
    });
  }, [client]);
  
  return sdk;
}
```

### 3. Veri Okuma (Getter Functions)

```typescript
// İş ilanlarını getir
const jobs = await miniHub.getAllJobs();
const activeJobs = await miniHub.getActiveJobs();
const job = await miniHub.getJob(jobId);

// Profilleri getir
const userProfile = await miniHub.getUserProfile(profileId);
const employerProfile = await miniHub.getEmployerProfile(profileId);

// Başvuruları getir
const applications = await miniHub.getJobApplications(jobId);
const userApps = await miniHub.getUserApplications(userAddress);

// İstatistikler
const stats = await miniHub.getStatistics();
```

### 4. Transaction Oluşturma (TX Functions)

```typescript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function PostJobButton() {
  const miniHub = useMiniHub();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handlePostJob = () => {
    // Transaction oluştur
    const tx = miniHub.createPostJobTransaction({
      employerProfileId: 'YOUR_EMPLOYER_PROFILE_ID',
      title: 'Senior Move Developer',
      description: 'Looking for experienced Move developer',
      salary: 100000, // optional
      deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 gün sonra
    });

    // İmzala ve gönder
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log('İş ilanı yayınlandı:', result);
        },
      }
    );
  };

  return <button onClick={handlePostJob}>İş İlanı Yayınla</button>;
}
```

## ✨ Özellikler

### � Getter Functions (Veri Okuma)
- ✅ İş ilanlarını listeleme ve filtreleme
- ✅ Kullanıcı ve işveren profillerini getirme
- ✅ Başvuruları görüntüleme
- ✅ Platform istatistikleri
- ✅ Event geçmişi

### 🔄 Transaction Functions
- ✅ İş ilanı yayınlama
- ✅ İşe başvurma
- ✅ Aday işe alma
- ✅ Kullanıcı profili oluşturma ve güncelleme
- ✅ İşveren profili oluşturma ve güncelleme

### 🛠 Helper Functions
- ✅ Tarih ve zaman formatlama
- ✅ Maaş formatlama
- ✅ İş durumu kontrolleri
- ✅ Sıralama ve filtreleme
- ✅ Arama fonksiyonları
- ✅ Validasyon

## 📖 API Referansı

### Getter Functions (Veri Okuma)

#### İş İlanları

```typescript
// JobBoard bilgisi
getJobBoard(): Promise<JobBoard | null>

// Tek iş ilanı
getJob(jobId: string): Promise<Job | null>

// Tüm iş ilanları
getAllJobs(): Promise<Job[]>

// Aktif iş ilanları
getActiveJobs(): Promise<Job[]>

// İşverene göre ilanlar
getJobsByEmployer(employerAddress: string): Promise<Job[]>

// İş başvuruları
getJobApplications(jobId: string): Promise<ApplicationProfile[]>
```

#### Profiller

```typescript
// Kullanıcı profili
getUserProfile(profileId: string): Promise<UserProfile | null>
getUserProfileByAddress(userAddress: string): Promise<UserProfile | null>
getAllUserProfiles(): Promise<UserProfile[]>

// İşveren profili
getEmployerProfile(profileId: string): Promise<EmployerProfile | null>
getEmployerProfileByAddress(employerAddress: string): Promise<EmployerProfile | null>
getAllEmployerProfiles(): Promise<EmployerProfile[]>

// Kayıt defterleri
getUserRegistry(): Promise<UserRegistry | null>
getEmployerRegistry(): Promise<EmployerRegistry | null>
```

#### Diğer

```typescript
// İşveren yetkileri
getEmployerCaps(ownerAddress: string): Promise<EmployerCap[]>

// Kullanıcı başvuruları
getUserApplications(userAddress: string): Promise<ApplicationProfile[]>

// Kontroller
hasUserAppliedToJob(jobId: string, userAddress: string): Promise<boolean>

// İstatistikler
getStatistics(): Promise<{
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalUsers: number;
  totalEmployers: number;
  filledJobs: number;
}>
```

### Transaction Functions

```typescript
// İş ilanı yayınlama
createPostJobTransaction(params: {
  employerProfileId: string;
  title: string;
  description: string;
  salary?: number;
  deadline: number;
}): Transaction

// İşe başvurma
createApplyToJobTransaction(params: {
  jobId: string;
  userProfileId: string;
  coverMessage: string;
  cvUrl: string;
}): Transaction

// Aday işe alma
createHireCandidateTransaction(params: {
  jobId: string;
  employerCapId: string;
  candidateAddress: string;
  candidateIndex: number;
}): Transaction

// Kullanıcı profili oluşturma
createUserProfileTransaction(params: {
  name: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
  experienceYears: number;
  portfolioUrl: string;
}): Transaction

// İşveren profili oluşturma
createEmployerProfileTransaction(params: {
  companyName: string;
  description: string;
  logoUrl: string;
  website: string;
  industry: string;
  employeeCount: number;
  foundedYear: number;
}): Transaction

// Profil güncelleme
createUpdateUserProfileTransaction(params: {...}): Transaction
createUpdateEmployerProfileTransaction(params: {...}): Transaction
```

### Helper Functions

```typescript
// Tarih/Zaman
formatTimestamp(timestamp: number): string
getRelativeTime(timestamp: number): string // "2 gün önce"
getTimeUntilDeadline(deadline: number): string // "5 gün"

// Maaş
formatSalary(salary?: number): string // "₺50.000"

// İş durumu
isJobActive(job: Job): boolean
isJobDeadlinePassed(job: Job): boolean

// Sıralama
sortJobsByApplicationCount(jobs: Job[], ascending?: boolean): Job[]
sortJobsByDeadline(jobs: Job[], ascending?: boolean): Job[]

// Filtreleme
filterJobsBySalaryRange(jobs: Job[], minSalary?: number, maxSalary?: number): Job[]
searchJobs(jobs: Job[], query: string): Job[]
searchUserProfilesBySkills(profiles: UserProfile[], skills: string[]): UserProfile[]
filterEmployersByIndustry(profiles: EmployerProfile[], industry: string): EmployerProfile[]

// Validasyon
validatePostJobParams(params: {...}): { valid: boolean; errors: string[] }
validateUserProfileParams(params: {...}): { valid: boolean; errors: string[] }

// Event'ler
getEvents(params: { eventType: string; limit?: number; cursor?: string }): Promise<any[]>
getJobPostedEvents(limit?: number): Promise<JobPostedEvent[]>
getApplicationSubmittedEvents(limit?: number): Promise<ApplicationSubmittedEvent[]>
getCandidateHiredEvents(limit?: number): Promise<CandidateHiredEvent[]>
```

## 📝 Detaylı Kullanım

Detaylı örnekler ve kullanım senaryoları için [USAGE.md](./USAGE.md) dosyasına bakın.

### Temel Örnekler

**İş İlanlarını Listeleme:**
```typescript
const jobs = await miniHub.getActiveJobs();
const sortedJobs = miniHub.sortJobsByDeadline(jobs);
```

**Arama ve Filtreleme:**
```typescript
const filtered = miniHub.filterJobsBySalaryRange(jobs, 30000, 60000);
const searched = miniHub.searchJobs(filtered, "developer");
```

**Transaction Gönderme:**
```typescript
const tx = miniHub.createApplyToJobTransaction({
  jobId: job.id,
  userProfileId: profile.id,
  coverMessage: "I'm interested!",
  cvUrl: "https://...",
});

signAndExecute({ transaction: tx });
```

## 🔧 TypeScript Tipleri

SDK, tam TypeScript desteği sağlar:

```typescript
import type {
  Job,
  ApplicationProfile,
  UserProfile,
  EmployerProfile,
  PackageConfig,
  JobPostedEvent,
  // ... diğer tipler
} from './minihub';
```

## 🌍 Environment Variables

`.env.local` dosyanızda:

```bash
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_JOB_BOARD_ID=0x...
NEXT_PUBLIC_USER_REGISTRY_ID=0x...
NEXT_PUBLIC_EMPLOYER_REGISTRY_ID=0x...
```

## 🚨 Hata Yönetimi

```typescript
import { ErrorCode, ERROR_MESSAGES } from './minihub';

try {
  const tx = miniHub.createApplyToJobTransaction({...});
  await signAndExecute({ transaction: tx });
} catch (error: any) {
  // Hata kontrolü
  if (error.code === ErrorCode.DEADLINE_PASSED) {
    console.error(ERROR_MESSAGES[ErrorCode.DEADLINE_PASSED]);
  }
}
```

Error Kodları:
- `NOT_AUTHORIZED` (1): Yetkisiz erişim
- `JOB_ALREADY_FILLED` (2): İş pozisyonu zaten dolu
- `INVALID_APPLICATION` (3): Geçersiz başvuru
- `DEADLINE_PASSED` (4): Son başvuru tarihi geçti

## 📚 Daha Fazla Bilgi

- [Detaylı Kullanım Kılavuzu](./USAGE.md) - Kapsamlı örnekler ve senaryolar
- [Move Kontrat Dokümantasyonu](../sources/minihub.move) - Akıllı kontrat kodu
- [Sui Dokümantasyonu](https://docs.sui.io/) - Sui blockchain dokümantasyonu

## 🤝 Katkıda Bulunma

Katkılar memnuniyetle karşılanır! Lütfen bir issue açın veya pull request gönderin.

## 📄 Lisans

MIT

---

**Not:** Bu SDK, Sui blockchain üzerinde çalışan MiniHub akıllı kontratı için tasarlanmıştır. React uygulamalarında kullanım için optimize edilmiştir ve tam TypeScript desteği sunar.

pnpm build

# Watch mode
pnpm dev
```

## 📄 License

MIT
