# Blockchain Integration Setup

## Overview
The application is now fully integrated with the blockchain SDK. The Profile and CreateJob pages will submit transactions to the Sui blockchain when you interact with them.

## Required Environment Variables

Make sure your `.env` file contains the following:

```env
# Smart Contract Object IDs
VITE_JOB_BOARD_PACKAGE_ID=your_package_id_here
VITE_JOB_BOARD_OBJECT_ID=your_job_board_object_id_here
VITE_USER_REGISTRY_ID=your_user_registry_id_here
VITE_EMPLOYER_REGISTRY_ID=your_employer_registry_id_here

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=50413225608-t9lbq237iaava7o0stcs9r155up8u9ia.apps.googleusercontent.com
VITE_REDIRECT_URL=http://localhost:5177
```

## How It Works

### Profile Page (`/profile`)
- **Create/Update Profile**: When you save your profile, it calls `createUpdateUserProfileTx()` which:
  - Creates a new `UserProfile` object if you don't have one
  - Updates your existing profile if you already have one
  - Stores: name, bio, avatar URL, skills array, experience years, portfolio URL
  - Transaction is signed with your wallet or zkLogin credentials

### Create Job Page (`/create-job`)
- **Post a Job**: When you submit the form, it calls `postJobTx()` which:
  - Creates a new `Job` object on the blockchain
  - Links it to the JobBoard
  - Stores: title, description, optional salary, application deadline
  - **Note**: Currently uses a placeholder employer profile ID (`TEMP_EMPLOYER_PROFILE_ID`)
  - You need to create an employer profile first before posting jobs

## Transaction Flow

1. User fills out the form (Profile or Job)
2. User clicks "Save" or "Post Job"
3. SDK builds the transaction using `Transaction` from `@mysten/sui/transactions`
4. Transaction is sent to the wallet/zkLogin for signing
5. Signed transaction is submitted to the Sui blockchain
6. Success/error feedback is shown to the user

## SDK Functions Available

### Read Functions (Already Working)
- `getJobBoard()` - Get the main job board object
- `getJob(id)` - Get a specific job
- `getAllJobs()` - Get all jobs from the board
- `getActiveJobs()` - Get only active jobs
- `getJobsByEmployer(address)` - Get jobs posted by a specific employer
- `getUserProfile(id)` - Get user profile by ID
- `getEmployerProfile(id)` - Get employer profile by ID
- `getApplicationProfile(id)` - Get application details

### Write Functions (Transaction Builders)
- `createUpdateUserProfileTx()` - Create or update user profile
- `createUpdateEmployerProfileTx()` - Create or update employer profile
- `postJobTx()` - Post a new job listing
- `applyToJobTx()` - Apply to a job
- `closeJobTx()` - Close a job posting (employer only)
- `hireCandidateTx()` - Hire a candidate (employer only)

## Next Steps

1. **Deploy Smart Contracts**: Deploy your Move smart contracts to Sui testnet
2. **Update .env**: Add the contract object IDs to your `.env` file
3. **Create Employer Profile**: Before posting jobs, users need to create an employer profile
4. **Test Transactions**: Try creating a profile and posting a job
5. **Add Application Flow**: Implement the job application functionality using `applyToJobTx()`

## Important Notes

- All transactions require authentication (wallet or zkLogin)
- Transactions will fail if the smart contract object IDs are not configured
- The Clock object ID is hardcoded to `0x6` (Sui's shared clock object)
- Salary is optional when posting jobs
- Deadline must be a future timestamp

## Error Handling

The UI includes error handling for:
- Transaction building errors
- Transaction signing errors
- Transaction execution errors
- All errors are displayed to the user with clear messages
