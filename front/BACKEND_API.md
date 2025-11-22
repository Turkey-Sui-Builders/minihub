# MiniHub Backend API Documentation

Backend API for the Sui Job Board application. This document outlines the required endpoints and data structures for integration with the smart contract.

## Base URL
```
http://localhost:3000/api  (development)
https://your-domain.com/api  (production)
```

## Smart Contract Structure

### On-Chain Data Structures

```move
// JobBoard - Main board containing all job postings
public struct JobBoard has key {
    id: UID,
    job_count: u64,
    job_ids: vector<ID>,
}

// Job - Individual job posting
public struct Job has key, store {
    id: UID,
    employer: address,
    title: String,
    description: String,
    salary: Option<u64>,
    application_count: u64,
    hired_candidate: Option<address>,
    is_active: bool,
    deadline: u64,  // milliseconds
}

// ApplicationProfile - Candidate application
public struct ApplicationProfile has key, store {
    id: UID,
    candidate: address,
    job_id: ID,
    cover_message: String,
    timestamp: u64,
    cv_url: String,
}

// EmployerCap - Employer capability
public struct EmployerCap has key, store {
    id: UID,
    job_id: ID,
}
```

## API Endpoints

### 1. Jobs

#### GET /jobs
Get all job postings with optional filters.

**Query Parameters:**
- `search` (string, optional): Search in title/company/description
- `category` (string, optional): Filter by category
- `type` (string, optional): Filter by job type (full-time, contract, etc.)
- `location` (string, optional): Filter by location
- `minSalary` (number, optional): Minimum salary filter
- `maxSalary` (number, optional): Maximum salary filter
- `isActive` (boolean, optional): Show only active jobs (default: true)
- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Items per page

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      // On-chain data
      "id": "0x123...",
      "employer": "0xabc...",
      "title": "Senior Blockchain Developer",
      "description": "Looking for experienced developer...",
      "salary": 150000,
      "application_count": 12,
      "hired_candidate": null,
      "is_active": true,
      "deadline": 1735689600000,
      
      // Off-chain enriched data
      "company": "Sui Foundation",
      "location": "Remote",
      "type": "full-time",
      "category": "Engineering",
      "salaryDisplay": "$120k - $180k",
      "deadlineDisplay": "2025-01-01",
      "postedDate": "2024-11-20",
      "companyLogo": "https://...",
      "tags": ["Move", "Rust", "Blockchain"]
    }
  ]
}
```

#### GET /jobs/:id
Get a single job by ID.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "0x123...",
    "employer": "0xabc...",
    // ... same structure as above
  }
}
```

#### GET /jobs/employer/:address
Get all jobs posted by a specific employer.

**Response:** Same as GET /jobs

---

### 2. Applications

#### GET /jobs/:jobId/applications
Get all applications for a specific job (employer only).

**Headers:**
- `X-Wallet-Address`: Employer wallet address
- `X-Signature`: Signed message for authentication

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "0xapp123...",
      "candidate": "0xcandidate...",
      "job_id": "0xjob123...",
      "cover_message": "I am excited to apply...",
      "timestamp": 1700000000000,
      "cv_url": "ipfs://..."
    }
  ]
}
```

#### GET /applications/candidate/:address
Get all applications by a specific candidate.

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "0xapp123...",
      "candidate": "0xcandidate...",
      "job_id": "0xjob123...",
      "cover_message": "I am excited to apply...",
      "timestamp": 1700000000000,
      "cv_url": "ipfs://...",
      // Optional enriched job data
      "job": {
        "title": "Senior Developer",
        "company": "Sui Foundation",
        // ... other job fields
      }
    }
  ]
}
```

#### POST /applications
Submit a new application (triggers blockchain transaction).

**Headers:**
- `X-Wallet-Address`: Candidate wallet address
- `X-Signature`: Signed message for authentication

**Body:**
```typescript
{
  "jobId": "0xjob123...",
  "coverMessage": "I am excited to apply for this position...",
  "cvUrl": "ipfs://Qm..."
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "applicationId": "0xapp123...",
    "transaction": "0xtx123..."
  },
  "message": "Application submitted successfully"
}
```

---

### 3. JobBoard

#### GET /job-board
Get JobBoard metadata.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "0xboard123...",
    "job_count": 150,
    "job_ids": ["0xjob1...", "0xjob2...", ...]
  }
}
```

---

### 4. Events

#### GET /events
Get recent blockchain events.

**Query Parameters:**
- `type` (string, optional): Event type (JobPosted, ApplicationSubmitted, CandidateHired)
- `limit` (number, optional): Number of events to return (default: 50)

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "type": "JobPosted",
      "job_id": "0xjob123...",
      "employer": "0xabc...",
      "title": "Senior Developer",
      "has_salary": true,
      "deadline": 1735689600000,
      "timestamp": 1700000000000
    }
  ]
}
```

---

### 5. Stats

#### GET /stats
Get platform statistics.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalJobs": 150,
    "activeJobs": 120,
    "totalApplications": 1250,
    "totalHired": 45
  }
}
```

---

## Authentication

All authenticated endpoints require:

**Headers:**
- `X-Wallet-Address`: User's Sui wallet address
- `X-Signature`: Signed message proving wallet ownership

**Signature Generation (Frontend):**
```typescript
// User signs a message with their wallet
const message = `Authenticate with MiniHub\nTimestamp: ${Date.now()}`;
const signature = await wallet.signMessage({ message });
```

---

## Error Responses

All endpoints return consistent error format:

```typescript
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

**Common Status Codes:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Off-Chain Data Storage

Off-chain metadata (company name, location, category, etc.) should be stored in your backend database and enriched when serving job data.

**Recommended Database Schema:**

```sql
CREATE TABLE job_metadata (
  job_id VARCHAR PRIMARY KEY,
  company VARCHAR,
  company_logo VARCHAR,
  location VARCHAR,
  job_type VARCHAR,
  category VARCHAR,
  tags JSONB,
  posted_date TIMESTAMP
);
```

---

## Environment Variables

Frontend `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUI_NETWORK=testnet
VITE_JOB_BOARD_PACKAGE_ID=0x...
VITE_JOB_BOARD_OBJECT_ID=0x...
```

---

## Next Steps

1. Set up your backend server with these endpoints
2. Configure environment variables
3. Update `API_BASE_URL` in `src/services/api.ts`
4. Test integration with frontend
5. Deploy smart contract and update package IDs

---

## Support

For questions or issues, please contact the development team.
