# MiniHub SDK - Kullanım Kılavuzu

Bu kılavuz, MiniHub SDK'sının React uygulamanızda nasıl kullanılacağını gösterir.

## Kurulum

```bash
npm install @mysten/sui
```

## Temel Kullanım

### 1. SDK'yı Başlatma

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createMiniHubSDK, DEFAULT_CLOCK_ID } from './minihub';

// Sui client oluştur
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// SDK'yı yapılandır
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

const CONFIG: PackageConfig = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  jobBoardId: process.env.NEXT_PUBLIC_JOB_BOARD_ID!,
  userRegistryId: process.env.NEXT_PUBLIC_USER_REGISTRY_ID!,
  employerRegistryId: process.env.NEXT_PUBLIC_EMPLOYER_REGISTRY_ID!,
  clockId: DEFAULT_CLOCK_ID,
};

export function useMiniHub() {
  const client = useSuiClient();
  
  const sdk = useMemo(() => {
    return createMiniHubSDK(client, CONFIG);
  }, [client]);
  
  return sdk;
}
```

## Örnekler

### İş İlanlarını Listeleme

```typescript
import { useMiniHub } from '../hooks/useMiniHub';
import { useState, useEffect } from 'react';
import { Job } from '../sdk/minihub';

function JobList() {
  const miniHub = useMiniHub();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const activeJobs = await miniHub.getActiveJobs();
        setJobs(activeJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [miniHub]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      {jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.description}</p>
          <p>Maaş: {miniHub.formatSalary(job.salary)}</p>
          <p>Son Başvuru: {miniHub.formatTimestamp(job.deadline)}</p>
          <p>Başvuru Sayısı: {job.applicationCount}</p>
        </div>
      ))}
    </div>
  );
}
```

### Kullanıcı Profili Oluşturma

```typescript
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useMiniHub } from '../hooks/useMiniHub';

function CreateUserProfile() {
  const miniHub = useMiniHub();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  const handleCreateProfile = async (data: {
    name: string;
    bio: string;
    avatarUrl: string;
    skills: string[];
    experienceYears: number;
    portfolioUrl: string;
  }) => {
    // Validasyon
    const validation = miniHub.validateUserProfileParams({
      name: data.name,
      bio: data.bio,
      experienceYears: data.experienceYears,
    });

    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    // Transaction oluştur
    const tx = miniHub.createUserProfileTransaction(data);

    // Transaction'ı imzala ve gönder
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Profil oluşturuldu!', result);
          await client.waitForTransaction({
            digest: result.digest,
          });
          alert('Profil başarıyla oluşturuldu!');
        },
        onError: (error) => {
          console.error('Hata:', error);
          alert('Profil oluşturulamadı!');
        },
      }
    );
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleCreateProfile({
        name: formData.get('name') as string,
        bio: formData.get('bio') as string,
        avatarUrl: formData.get('avatarUrl') as string,
        skills: (formData.get('skills') as string).split(',').map(s => s.trim()),
        experienceYears: Number(formData.get('experienceYears')),
        portfolioUrl: formData.get('portfolioUrl') as string,
      });
    }}>
      <input name="name" placeholder="İsim Soyisim" required />
      <textarea name="bio" placeholder="Biyografi" required />
      <input name="avatarUrl" placeholder="Avatar URL" />
      <input name="skills" placeholder="Yetenekler (virgülle ayırın)" />
      <input name="experienceYears" type="number" placeholder="Tecrübe Yılı" required />
      <input name="portfolioUrl" placeholder="Portfolio URL" />
      <button type="submit">Profil Oluştur</button>
    </form>
  );
}
```

### İş İlanı Yayınlama

```typescript
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useMiniHub } from '../hooks/useMiniHub';
import { useState, useEffect } from 'react';

function PostJob() {
  const miniHub = useMiniHub();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [employerProfile, setEmployerProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      if (currentAccount?.address) {
        const profile = await miniHub.getEmployerProfileByAddress(currentAccount.address);
        setEmployerProfile(profile);
      }
    }
    loadProfile();
  }, [currentAccount, miniHub]);

  const handlePostJob = async (data: {
    title: string;
    description: string;
    salary?: number;
    deadline: Date;
  }) => {
    if (!employerProfile) {
      alert('Önce işveren profili oluşturmalısınız!');
      return;
    }

    // Validasyon
    const validation = miniHub.validatePostJobParams({
      title: data.title,
      description: data.description,
      deadline: data.deadline.getTime(),
    });

    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    // Transaction oluştur
    const tx = miniHub.createPostJobTransaction({
      employerProfileId: employerProfile.id,
      title: data.title,
      description: data.description,
      salary: data.salary,
      deadline: data.deadline.getTime(),
    });

    // Transaction'ı imzala ve gönder
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log('İş ilanı yayınlandı!', result);
          alert('İş ilanı başarıyla yayınlandı!');
        },
        onError: (error) => {
          console.error('Hata:', error);
          alert('İş ilanı yayınlanamadı!');
        },
      }
    );
  };

  if (!employerProfile) {
    return <div>İşveren profili bulunamadı. Lütfen önce profil oluşturun.</div>;
  }

  return <div>İş ilanı formu...</div>;
}
```

### İşe Başvurma

```typescript
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useMiniHub } from '../hooks/useMiniHub';
import { Job } from '../sdk/minihub';

function ApplyToJob({ job }: { job: Job }) {
  const miniHub = useMiniHub();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleApply = async (coverMessage: string, cvUrl: string) => {
    if (!currentAccount?.address) {
      alert('Lütfen cüzdanınızı bağlayın!');
      return;
    }

    // Kullanıcı profilini kontrol et
    const userProfile = await miniHub.getUserProfileByAddress(currentAccount.address);
    
    if (!userProfile) {
      alert('Önce kullanıcı profili oluşturmalısınız!');
      return;
    }

    // Daha önce başvuru yapılmış mı kontrol et
    const hasApplied = await miniHub.hasUserAppliedToJob(job.id, currentAccount.address);
    
    if (hasApplied) {
      alert('Bu işe zaten başvurdunuz!');
      return;
    }

    // Deadline kontrolü
    if (miniHub.isJobDeadlinePassed(job)) {
      alert('Bu işin başvuru süresi dolmuş!');
      return;
    }

    // Transaction oluştur
    const tx = miniHub.createApplyToJobTransaction({
      jobId: job.id,
      userProfileId: userProfile.id,
      coverMessage,
      cvUrl,
    });

    // Transaction'ı imzala ve gönder
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log('Başvuru yapıldı!', result);
          alert('Başvurunuz başarıyla gönderildi!');
        },
        onError: (error) => {
          console.error('Hata:', error);
          alert('Başvuru gönderilemedi!');
        },
      }
    );
  };

  return (
    <div>
      <h3>{job.title}</h3>
      <p>{job.description}</p>
      <p>Kalan süre: {miniHub.getTimeUntilDeadline(job.deadline)}</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleApply(
          formData.get('coverMessage') as string,
          formData.get('cvUrl') as string
        );
      }}>
        <textarea name="coverMessage" placeholder="Ön yazı" required />
        <input name="cvUrl" placeholder="CV URL" required />
        <button type="submit">Başvur</button>
      </form>
    </div>
  );
}
```

### Başvuruları Görüntüleme

```typescript
import { useMiniHub } from '../hooks/useMiniHub';
import { useState, useEffect } from 'react';
import { ApplicationProfile } from '../sdk/minihub';

function JobApplications({ jobId }: { jobId: string }) {
  const miniHub = useMiniHub();
  const [applications, setApplications] = useState<ApplicationProfile[]>([]);

  useEffect(() => {
    async function loadApplications() {
      const apps = await miniHub.getJobApplications(jobId);
      setApplications(apps);
    }
    loadApplications();
  }, [jobId, miniHub]);

  return (
    <div>
      <h3>Başvurular ({applications.length})</h3>
      {applications.map((app) => (
        <div key={app.id}>
          <p>Aday: {app.candidate}</p>
          <p>Ön yazı: {app.coverMessage}</p>
          <p>CV: <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">Görüntüle</a></p>
          <p>Başvuru zamanı: {miniHub.formatTimestamp(app.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}
```

### İstatistikler

```typescript
import { useMiniHub } from '../hooks/useMiniHub';
import { useState, useEffect } from 'react';

function Statistics() {
  const miniHub = useMiniHub();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const statistics = await miniHub.getStatistics();
      setStats(statistics);
    }
    loadStats();
  }, [miniHub]);

  if (!stats) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h2>Platform İstatistikleri</h2>
      <p>Toplam İş İlanı: {stats.totalJobs}</p>
      <p>Aktif İş İlanı: {stats.activeJobs}</p>
      <p>Doldurulan Pozisyonlar: {stats.filledJobs}</p>
      <p>Toplam Başvuru: {stats.totalApplications}</p>
      <p>Kayıtlı Kullanıcı: {stats.totalUsers}</p>
      <p>Kayıtlı İşveren: {stats.totalEmployers}</p>
    </div>
  );
}
```

### Filtreleme ve Arama

```typescript
import { useMiniHub } from '../hooks/useMiniHub';
import { useState, useEffect } from 'react';
import { Job } from '../sdk/minihub';

function JobSearch() {
  const miniHub = useMiniHub();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minSalary, setMinSalary] = useState<number>();
  const [maxSalary, setMaxSalary] = useState<number>();

  useEffect(() => {
    async function loadJobs() {
      const jobs = await miniHub.getActiveJobs();
      setAllJobs(jobs);
      setFilteredJobs(jobs);
    }
    loadJobs();
  }, [miniHub]);

  useEffect(() => {
    let filtered = [...allJobs];

    // Arama sorgusu
    if (searchQuery) {
      filtered = miniHub.searchJobs(filtered, searchQuery);
    }

    // Maaş aralığı
    if (minSalary || maxSalary) {
      filtered = miniHub.filterJobsBySalaryRange(filtered, minSalary, maxSalary);
    }

    // Son başvuru tarihine göre sırala
    filtered = miniHub.sortJobsByDeadline(filtered, true);

    setFilteredJobs(filtered);
  }, [searchQuery, minSalary, maxSalary, allJobs, miniHub]);

  return (
    <div>
      <input
        type="text"
        placeholder="İş ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <input
        type="number"
        placeholder="Min maaş"
        value={minSalary || ''}
        onChange={(e) => setMinSalary(e.target.value ? Number(e.target.value) : undefined)}
      />
      <input
        type="number"
        placeholder="Max maaş"
        value={maxSalary || ''}
        onChange={(e) => setMaxSalary(e.target.value ? Number(e.target.value) : undefined)}
      />

      <div>
        {filteredJobs.map((job) => (
          <div key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.description}</p>
            <p>Maaş: {miniHub.formatSalary(job.salary)}</p>
            <p>Kalan süre: {miniHub.getTimeUntilDeadline(job.deadline)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Helper Fonksiyonlar

SDK, birçok kullanışlı helper fonksiyonu içerir:

```typescript
// Tarih formatlama
miniHub.formatTimestamp(timestamp);
miniHub.getRelativeTime(timestamp); // "2 gün önce"
miniHub.getTimeUntilDeadline(deadline); // "5 gün"

// Maaş formatlama
miniHub.formatSalary(50000); // "₺50.000"

// İş durumu kontrolleri
miniHub.isJobActive(job);
miniHub.isJobDeadlinePassed(job);

// Sıralama
miniHub.sortJobsByApplicationCount(jobs);
miniHub.sortJobsByDeadline(jobs);

// Filtreleme
miniHub.filterJobsBySalaryRange(jobs, 30000, 60000);
miniHub.searchJobs(jobs, "developer");
miniHub.searchUserProfilesBySkills(profiles, ["React", "TypeScript"]);
miniHub.filterEmployersByIndustry(employers, "teknoloji");

// Validasyon
miniHub.validatePostJobParams({ title, description, deadline });
miniHub.validateUserProfileParams({ name, bio, experienceYears });

// İstatistikler
await miniHub.getStatistics();

// Event'ler
await miniHub.getJobPostedEvents(10);
await miniHub.getApplicationSubmittedEvents(10);
await miniHub.getCandidateHiredEvents(10);
```

## Environment Variables

`.env.local` dosyasında aşağıdaki değişkenleri tanımlayın:

```bash
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_JOB_BOARD_ID=0x...
NEXT_PUBLIC_USER_REGISTRY_ID=0x...
NEXT_PUBLIC_EMPLOYER_REGISTRY_ID=0x...
```

## TypeScript Tipler

SDK, tüm veri yapıları için TypeScript tipleri sağlar:

- `Job` - İş ilanı
- `ApplicationProfile` - Başvuru
- `UserProfile` - Kullanıcı profili
- `EmployerProfile` - İşveren profili
- `JobBoard` - İş panosu
- `UserRegistry` - Kullanıcı kayıt defteri
- `EmployerRegistry` - İşveren kayıt defteri
- `EmployerCap` - İşveren yetkisi

Event tipleri:
- `JobPostedEvent`
- `ApplicationSubmittedEvent`
- `CandidateHiredEvent`
- `UserProfileCreatedEvent`
- `EmployerProfileCreatedEvent`
- `ProfileUpdatedEvent`

## Hata Yönetimi

```typescript
import { ErrorCode, ERROR_MESSAGES } from './minihub';

try {
  // Transaction işlemleri
} catch (error: any) {
  // Error code'u kontrol et
  if (error.code === ErrorCode.DEADLINE_PASSED) {
    alert(ERROR_MESSAGES[ErrorCode.DEADLINE_PASSED]);
  }
}
```

## Notlar

- Tüm transaction fonksiyonları `Transaction` objesi döndürür, bu objeler `signAndExecute` ile imzalanıp gönderilmelidir
- Getter fonksiyonları async olup Promise döndürür
- Helper fonksiyonlar senkron çalışır
- SDK client-side rendering için optimize edilmiştir
- Tüm tarih ve zaman değerleri milisaniye cinsinden Unix timestamp olarak saklanır
