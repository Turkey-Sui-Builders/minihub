


# Mini Hub Board

A decentralized job board platform built on the Sui blockchain, enabling employers to post jobs and candidates to apply on-chain.

![Logo](./mini.gif)
## Features

### Core Functionality
- **Job Posting**: Employers can create job postings with title, description, and optional salary
- **Application Submission**: Candidates can submit applications with cover messages
- **Hiring**: Employers can review applications and hire candidates
- **Shared State**: Global JobBoard tracks all posted jobs

### Advanced Move Concepts Demonstrated

#### 1. Working with Vectors
- `applications: vector<Application>` - Stores multiple applications per job
- `job_ids: vector<ID>` - Tracks all job IDs in the JobBoard
- Vector operations: `push_back`, `length`, `borrow` for iteration

#### 2. Using Option<T>
- `salary: Option<u64>` - Optional salary field (employer can choose to disclose or not)
- `hired_candidate: Option<address>` - Tracks hired candidate (None when position is open, Some when filled)
- Option methods: `is_some()`, `is_none()`, `some()`, `none()`

#### 3. Shared Objects
- `JobBoard` - Shared object accessible by all users, tracks platform-wide state
- `Job` - Shared object for each job posting, allowing candidates to apply

#### 4. Events
- `JobPosted` - Emitted when employer creates a job
- `ApplicationSubmitted` - Emitted when candidate applies
- `CandidateHired` - Emitted when employer hires a candidate
- `JobBoardCreated` - Emitted when the platform initializes

#### 5. Access Control (Capability Pattern)
- `EmployerCap` - Capability object proving job ownership
- Only the employer with the matching capability can hire for their job
- Prevents unauthorized users from modifying job postings
- Dual verification: checks both capability job_id and sender address

## Smart Contract Structure

### Core Structs

```move
// Global shared object tracking all jobs
public struct JobBoard has key {
    id: UID,
    job_count: u64,

}

// Individual job posting
public struct Job has key, store {
    id: UID,
    employer: address,
    title: String,
    description: String,
    salary: Option<u64>,              // Optional<T> usage
    applications: vector<Application>, // Vector usage
    hired_candidate: Option<address>, // Optional<T> usage
    is_active: bool,
}

// Candidate application
public struct Application has store, copy, drop {
    candidate: address,
    cover_message: String,
    timestamp: u64,
}

// Employer capability for access control
public struct EmployerCap has key, store {
    id: UID,
    job_id: ID,
}
```

### Main Functions

#### `post_job`
- Creates a new job posting
- Issues an `EmployerCap` to the employer for access control
- Adds job to the global JobBoard
- Emits `JobPosted` event

#### `apply_to_job`
- Allows candidates to submit applications
- Stores application in the job's vector
- Requires job to be active and unfilled
- Emits `ApplicationSubmitted` event

#### `hire_candidate`
- Employer hires a candidate (requires `EmployerCap`)
- Access control: verifies employer owns the job via capability
- Updates `hired_candidate` from `None` to `Some(address)`
- Marks job as inactive
- Emits `CandidateHired` event

### View Functions
- `get_job_info` - Returns job details
- `get_application_count` - Returns number of applications
- `get_total_jobs` - Returns total jobs on platform
- `is_job_filled` - Checks if position is filled

## Testing

The project includes comprehensive unit tests covering:

1. **Happy Paths**
   - Posting jobs with and without salary
   - Multiple candidates applying to jobs
   - Successful hiring flow
   - Multiple job postings

2. **Access Control**
   - Unauthorized users cannot hire (capability check)
   
3. **Business Logic**
   - Cannot apply to filled positions
   - Cannot hire non-applicants
   - Position status updates correctly

### Run Tests

```bash
sui move test
```

All 8 tests pass successfully:
- `test_post_job_with_salary`
- `test_post_job_without_salary`
- `test_apply_to_job`
- `test_hire_candidate`
- `test_hire_without_permission` (expected failure)
- `test_apply_to_filled_job` (expected failure)
- `test_hire_non_applicant` (expected failure)
- `test_multiple_jobs`

## Building

```bash
sui move build
```

## Deployment

```bash
sui client publish --gas-budget 100000000
```

## Usage Example

```bash
sui client call --package <PACKAGE_ID> --module minihub --function post_job \
  --args <JOB_BOARD_ID> "Senior Move Developer" "Build blockchain apps" "some(150000)" \
  --gas-budget 10000000
```

### 2. Candidate Applies
```bash
sui client call --package <PACKAGE_ID> --module minihub --function apply_to_job \
  --args <JOB_ID> "I have 5 years of blockchain experience" <CLOCK_ID> \
  --gas-budget 10000000
```

### 3. Employer Hires Candidate
```bash
sui client call --package <PACKAGE_ID> --module minihub --function hire_candidate \
  --args <JOB_ID> <EMPLOYER_CAP_ID> <CANDIDATE_ADDRESS> \
  --gas-budget 10000000
```

## Security Features

1. **Capability-Based Access Control**: Only employers with the matching `EmployerCap` can hire for their jobs
2. **Double Verification**: Both capability ID and sender address are verified
3. **State Validation**: Checks prevent hiring for filled positions or non-existent applications
4. **Immutable History**: All applications are stored on-chain permanently

## Error Codes

- `ENotAuthorized (1)`: Caller doesn't have permission to perform action
- `EJobAlreadyFilled (2)`: Cannot apply/hire for already filled position
- `EInvalidApplication (3)`: Trying to hire candidate who didn't apply

## License

MIT

---

# TypeScript/React SDK Kullanımı

MiniHub Move kontratı ile TypeScript/React üzerinden etkileşim için optimize edilmiş SDK'yı kullanabilirsiniz. Tüm fonksiyonlar, veri yapıları ve event'ler Move kontratı ile birebir uyumludur.

## Kurulum

```bash
npm install @mysten/sui
```

`/sdk/minihub.ts` dosyasını projenize ekleyin.

## SDK'yı Başlatma

```typescript
import { SuiClient } from '@mysten/sui/client';
import { createMiniHubSDK, DEFAULT_CLOCK_ID } from './sdk/minihub';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const sdk = createMiniHubSDK(client, {
  packageId: '<PACKAGE_ID>',
  jobBoardId: '<JOB_BOARD_ID>',
  userRegistryId: '<USER_REGISTRY_ID>',
  employerRegistryId: '<EMPLOYER_REGISTRY_ID>',
  clockId: DEFAULT_CLOCK_ID,
});
```

## Transaction Fonksiyonları

### 1. İş İlanı Yayınlama
```typescript
const tx = sdk.createPostJobTransaction({
  employerProfileId: '<EMPLOYER_PROFILE_ID>',
  title: 'Senior Move Developer',
  description: 'Build blockchain apps',
  salary: 150000,
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 hafta sonrası
});
// client.signAndExecuteTransactionBlock({ transactionBlock: tx, ... })
```

### 2. İşe Başvuru
```typescript
const tx = sdk.createApplyToJobTransaction({
  jobId: '<JOB_ID>',
  userProfileId: '<USER_PROFILE_ID>',
  coverMessage: 'I have 5 years of blockchain experience',
  cvUrl: 'https://mycv.com/cv.pdf',
});
```

### 3. Adayı İşe Alma
```typescript
const tx = sdk.createHireCandidateTransaction({
  jobId: '<JOB_ID>',
  employerCapId: '<EMPLOYER_CAP_ID>',
  candidateAddress: '<CANDIDATE_ADDRESS>',
  candidateIndex: 0,
});
```

### 4. Kullanıcı Profili Oluşturma
```typescript
const tx = sdk.createUserProfileTransaction({
  name: 'Berkay',
  bio: 'Blockchain developer',
  avatarUrl: 'https://avatar.com/me.png',
  skills: ['Move', 'TypeScript'],
  experienceYears: 5,
  portfolioUrl: 'https://portfolio.com',
});
```

### 5. İşveren Profili Oluşturma
```typescript
const tx = sdk.createEmployerProfileTransaction({
  companyName: 'Sui Labs',
  description: 'Web3 company',
  logoUrl: 'https://logo.com/logo.png',
  website: 'https://suilabs.com',
  industry: 'Blockchain',
  employeeCount: 50,
  foundedYear: 2022,
});
```

## Getter Fonksiyonları

### Tüm İş İlanlarını Getir
```typescript
const jobs = await sdk.getAllJobs();
```

### Belirli Bir İş İlanı Detayı
```typescript
const job = await sdk.getJob('<JOB_ID>');
```

### Başvuru Sayısı
```typescript
const count = await sdk.getJob('<JOB_ID>').then(j => j?.applicationCount);
```

### Kullanıcı Profili Detayı
```typescript
const profile = await sdk.getUserProfile('<USER_PROFILE_ID>');
```

### İşveren Profili Detayı
```typescript
const employer = await sdk.getEmployerProfile('<EMPLOYER_PROFILE_ID>');
```

### Tüm Başvuruları Getir
```typescript
const applications = await sdk.getJobApplications('<JOB_ID>');
```

## Event Dinleme

```typescript
const jobPostedEvents = await sdk.getJobPostedEvents();
const applicationEvents = await sdk.getApplicationSubmittedEvents();
const hiredEvents = await sdk.getCandidateHiredEvents();
```

## Hata Yönetimi

```typescript
import { ErrorCode, ERROR_MESSAGES } from './sdk/minihub';

try {
  // işlem
} catch (e: any) {
  if (e.code && ERROR_MESSAGES[e.code]) {
    alert(ERROR_MESSAGES[e.code]);
  }
}
```

## React ile Kullanım

```typescript
import { useEffect, useState } from 'react';

function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    sdk.getAllJobs().then(setJobs);
  }, []);

  return (
    <ul>
      {jobs.map(job => (
        <li key={job.id}>{job.title} - {sdk.formatSalary(job.salary)}</li>
      ))}
    </ul>
  );
}
```

![Logo](./mini.gif)
