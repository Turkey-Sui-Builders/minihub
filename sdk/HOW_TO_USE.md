# MiniHub SDK Nasıl Kullanılır?

Bu döküman, MiniHub akıllı kontratı için oluşturulan TypeScript SDK'nın projende nasıl kullanılacağını adım adım anlatır.

---

## 1. Kurulum

Önce Sui SDK'yı yükle:
```bash
npm install @mysten/sui
```

MiniHub SDK dosyasını projenin uygun bir klasörüne ekle (ör: `sdk/minihub.ts`).

---

## 2. SDK'yı Başlatma

```typescript
import { SuiClient } from '@mysten/sui/client';
import { createMiniHubSDK, PackageConfig } from './sdk/minihub';

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

const config: PackageConfig = {
  packageId: '0x...', // Move package ID
  jobBoardId: '0x...', // JobBoard object ID
  userRegistryId: '0x...', // UserRegistry object ID
  employerRegistryId: '0x...', // EmployerRegistry object ID
  clockId: '0x6', // Clock object ID (genellikle default)
};

const sdk = createMiniHubSDK(suiClient, config);
```

---

## 3. Veri Okuma (Getter Fonksiyonları)

```typescript
// Tüm aktif iş ilanlarını çekmek
const jobs = await sdk.getActiveJobs();

// Belirli bir iş ilanı
const job = await sdk.getJob('0xJobId');

// Kullanıcı profili
const userProfile = await sdk.getUserProfile('0xProfileId');

// İşveren profili
const employerProfile = await sdk.getEmployerProfile('0xProfileId');
```

---

## 4. Transaction Oluşturma

```typescript
// Yeni iş ilanı oluşturmak için transaction block
const tx = sdk.createPostJobTransaction({
  employerProfileId: '0xEmployerProfileId',
  title: 'Frontend Developer',
  description: 'React bilen geliştirici arıyoruz.',
  salary: 50000,
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 hafta sonrası
});
// Transaction'ı wallet ile sign & submit edebilirsin
```

---

## 5. Helper Fonksiyonları

```typescript
// Maaşı formatlamak
const formattedSalary = sdk.formatSalary(job.salary);

// Tarihi formatlamak
const readableDate = sdk.formatTimestamp(job.deadline);

// İş ilanı aktif mi?
const isActive = sdk.isJobActive(job);

// Arama ve filtreleme
const filteredJobs = sdk.filterJobsBySalaryRange(jobs, 30000, 100000);
const searchedJobs = sdk.searchJobs(jobs, 'React');
```

---

## 6. Event Fonksiyonları

```typescript
// Son iş ilanı olaylarını çekmek
const events = await sdk.getJobPostedEvents(10);

// Son başvuru olaylarını çekmek
const applications = await sdk.getApplicationSubmittedEvents(10);
```

---

## 7. React ile Kullanım Örneği

```typescript
import React, { useEffect, useState } from 'react';
import { createMiniHubSDK, Job } from './sdk/minihub';
import { SuiClient } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const config = { /* ... */ };
const sdk = createMiniHubSDK(suiClient, config);

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    sdk.getActiveJobs().then(setJobs);
  }, []);

  return (
    <ul>
      {jobs.map(job => (
        <li key={job.id}>
          {job.title} - {sdk.formatSalary(job.salary)}
        </li>
      ))}
    </ul>
  );
};

export default JobList;
```

---

## 8. Hata Kodları ve Mesajları

```typescript
import { ErrorCode, ERROR_MESSAGES } from './sdk/minihub';
console.log(ERROR_MESSAGES[ErrorCode.NOT_AUTHORIZED]); // "Yetkisiz erişim"
```

---

Daha fazla detay için kodun içindeki JSDoc açıklamalarını inceleyebilirsin.
