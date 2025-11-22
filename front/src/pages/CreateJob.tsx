import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useZkLogin } from '../hooks/useZkLogin';
import { MiniHubSDK } from '../sdk/minihub-sdk-simple';
import './CreateJob.css';

export function CreateJob() {
  const walletAccount = useCurrentAccount();
  const zkLogin = useZkLogin();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const userAddress = walletAccount?.address || zkLogin.address;
  const isAuthenticated = !!walletAccount || zkLogin.isConnected;

  const [employerProfileId, setEmployerProfileId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    salary: '',
    hasSalary: false,
    deadline: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load employer profile on mount
  useEffect(() => {
    const loadEmployerProfile = async () => {
      if (!userAddress) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const sdk = new MiniHubSDK(client, {
          packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
          jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID,
          userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
          employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID,
          clockId: '0x6',
        });

        const profile = await sdk.getEmployerProfileByAddress(userAddress);
        if (profile) {
          setEmployerProfileId(profile.id);
          console.log('✅ Employer profile loaded:', profile.id);
        } else {
          console.log('⚠️ No employer profile found for this wallet');
        }
      } catch (error) {
        console.error('Error loading employer profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadEmployerProfile();
  }, [userAddress, client]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!jobData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!jobData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (jobData.hasSalary && !jobData.salary) {
      newErrors.salary = 'Salary is required when specified';
    }

    if (!jobData.deadline) {
      newErrors.deadline = 'Application deadline is required';
    } else {
      const deadlineDate = new Date(jobData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userAddress) {
      setSubmitStatus({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    if (!employerProfileId) {
      setSubmitStatus({ type: 'error', message: 'You need to create an employer profile before posting jobs. Contact support to create one.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const sdk = new MiniHubSDK(client, {
        packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
        jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID,
        userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
        employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID,
        clockId: '0x6',
      });

      // Convert deadline to timestamp
      const deadlineTimestamp = new Date(jobData.deadline).getTime();
      
      // Convert salary to number if provided
      const salary = jobData.hasSalary && jobData.salary 
        ? parseFloat(jobData.salary) 
        : undefined;

      const tx = sdk.createPostJobTransaction({
        employerProfileId: employerProfileId,
        title: jobData.title,
        description: jobData.description,
        salary: salary,
        deadline: deadlineTimestamp,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Job posted successfully:', result);
            setSubmitStatus({ type: 'success', message: 'Job posted successfully! 🎉' });
            
            // Reset form after 2 seconds
            setTimeout(() => {
              setJobData({
                title: '',
                description: '',
                salary: '',
                hasSalary: false,
                deadline: '',
              });
              setSubmitStatus(null);
            }, 2000);
          },
          onError: (error) => {
            console.error('Error posting job:', error);
            setSubmitStatus({ type: 'error', message: 'Failed to post job. Please try again.' });
          },
        }
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      setSubmitStatus({ type: 'error', message: 'Failed to create transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="create-job-container">
        <div className="create-job-not-authenticated">
          <h2>Authentication Required</h2>
          <p>Please connect your wallet or sign in to post a job</p>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="create-job-container">
        <div className="create-job-loading">
          <div className="spinner"></div>
          <p>Loading your employer profile...</p>
        </div>
      </div>
    );
  }

  if (!employerProfileId) {
    return (
      <div className="create-job-container">
        <div className="create-job-not-authenticated">
          <h2>Employer Profile Required</h2>
          <p>You need to create an employer profile before posting jobs.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Employer profile creation feature is coming soon. Contact support to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-job-container">
      <div className="create-job-header">
        <h1>Post a New Job</h1>
        <p className="create-job-subtitle">Find the perfect candidate for your open position</p>
      </div>

      <form onSubmit={handleSubmit} className="create-job-form">
        <div className="form-section">
          <h2>Job Details</h2>

          <div className="form-field">
            <label htmlFor="title">
              Job Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Senior Blockchain Developer"
              value={jobData.title}
              onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          <div className="form-field">
            <label htmlFor="description">
              Job Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              placeholder="Describe the role, responsibilities, requirements, and what makes your team great..."
              value={jobData.description}
              onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
              className={errors.description ? 'error' : ''}
              rows={8}
            />
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>
        </div>

        <div className="form-section">
          <h2>Compensation</h2>

          <div className="form-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={jobData.hasSalary}
                onChange={(e) => setJobData({ 
                  ...jobData, 
                  hasSalary: e.target.checked,
                  salary: e.target.checked ? jobData.salary : '' 
                })}
              />
              <span>Specify salary range</span>
            </label>
          </div>

          {jobData.hasSalary && (
            <div className="form-field">
              <label htmlFor="salary">
                Annual Salary (USD) <span className="required">*</span>
              </label>
              <div className="salary-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  id="salary"
                  type="number"
                  placeholder="e.g., 120000"
                  value={jobData.salary}
                  onChange={(e) => setJobData({ ...jobData, salary: e.target.value })}
                  className={errors.salary ? 'error salary-input' : 'salary-input'}
                  min="0"
                />
              </div>
              {errors.salary && <div className="error-message">{errors.salary}</div>}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Application Timeline</h2>

          <div className="form-field">
            <label htmlFor="deadline">
              Application Deadline <span className="required">*</span>
            </label>
            <input
              id="deadline"
              type="date"
              value={jobData.deadline}
              onChange={(e) => setJobData({ ...jobData, deadline: e.target.value })}
              className={errors.deadline ? 'error' : ''}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.deadline && <div className="error-message">{errors.deadline}</div>}
          </div>
        </div>

        <div className="form-section employer-info">
          <h2>Employer Information</h2>
          <div className="employer-address">
            <label>Your Address</label>
            <div className="address-display">
              {userAddress?.slice(0, 10)}...{userAddress?.slice(-8)}
            </div>
          </div>
        </div>

        <div className="form-actions">
          {submitStatus && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}
          <div className="action-buttons">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
