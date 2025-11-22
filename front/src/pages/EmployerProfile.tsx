import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useZkLogin } from '../hooks/useZkLogin';
import { MiniHubSDK, EmployerProfile as EmployerProfileType, Job, ApplicationProfile } from '../sdk/minihub-sdk-simple';
import { ApplicationsModal } from '../components/ApplicationsModal';
import './EmployerProfile.css';

export function EmployerProfile() {
  const walletAccount = useCurrentAccount();
  const zkLogin = useZkLogin();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const userAddress = walletAccount?.address || zkLogin.address;
  const isAuthenticated = !!walletAccount || zkLogin.isConnected;

  const [profileId, setProfileId] = useState<string | null>(null);
  const [sdk, setSdk] = useState<MiniHubSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicationProfile[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const [profileData, setProfileData] = useState<Omit<EmployerProfileType, 'id' | 'employerAddress' | 'createdAt' | 'updatedAt'>>({
    companyName: '',
    description: '',
    logoUrl: '',
    website: '',
    industry: '',
    employeeCount: 0,
    foundedYear: new Date().getFullYear(),
  });

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading employer profile for address:', userAddress);
        setIsLoading(true);

        const sdkInstance = new MiniHubSDK(client, {
          packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
          jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID,
          userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
          employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID,
          clockId: '0x6',
        });
        
        setSdk(sdkInstance);

        const profile = await sdkInstance.getEmployerProfileByAddress(userAddress);

        if (profile) {
          console.log('✅ Employer profile found:', profile);
          setProfileData({
            companyName: profile.companyName,
            description: profile.description,
            logoUrl: profile.logoUrl,
            website: profile.website,
            industry: profile.industry,
            employeeCount: profile.employeeCount,
            foundedYear: profile.foundedYear,
          });
          setProfileId(profile.id);
          console.log('✅ Profile ID set:', profile.id);

          // Load jobs posted by this employer
          setIsLoadingJobs(true);
          const jobs = await sdkInstance.getJobsByEmployer(userAddress);
          setPostedJobs(jobs);
          console.log('✅ Loaded', jobs.length, 'jobs posted by employer');
          setIsLoadingJobs(false);
        } else {
          console.log('⚠️ No employer profile found for this wallet');
          setIsEditMode(true); // Auto-enable edit mode for new profiles
        }
      } catch (error) {
        console.error('❌ Error loading employer profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userAddress, client]);

  const handleSave = async () => {
    if (!userAddress) return;

    // Check if user is using zkLogin
    if (zkLogin.isConnected && !walletAccount) {
      setSaveStatus({
        type: 'error',
        message: 'Profile editing is currently only available with wallet connection. Please connect a Sui wallet to edit your profile.',
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const sdk = new MiniHubSDK(client, {
        packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
        jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID,
        userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
        employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID,
        clockId: '0x6',
      });

      let tx;

      if (profileId) {
        console.log('Updating existing employer profile:', profileId);
        tx = sdk.createUpdateEmployerProfileTransaction({
          employerProfileId: profileId,
          ...profileData,
        });
      } else {
        console.log('Creating new employer profile for wallet:', userAddress);
        tx = sdk.createEmployerProfileTransaction(profileData);
      }

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('✅ Employer profile saved successfully:', result);
            setSaveStatus({ type: 'success', message: 'Employer profile saved successfully!' });
            setIsEditMode(false);

            // Reload profile after 3 seconds
            setTimeout(async () => {
              console.log('🔄 Reloading employer profile...');
              const profile = await sdk.getEmployerProfileByAddress(userAddress);
              if (profile) {
                setProfileData({
                  companyName: profile.companyName,
                  description: profile.description,
                  logoUrl: profile.logoUrl,
                  website: profile.website,
                  industry: profile.industry,
                  employeeCount: profile.employeeCount,
                  foundedYear: profile.foundedYear,
                });
                setProfileId(profile.id);
                console.log('✅ Profile data refreshed');
              }
            }, 3000);
          },
          onError: (error) => {
            console.error('❌ Error saving employer profile:', error);
            setSaveStatus({ type: 'error', message: 'Failed to save employer profile. Please try again.' });
          },
        }
      );
    } catch (error) {
      console.error('❌ Error saving employer profile:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save employer profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewApplications = async (job: Job) => {
    if (!sdk) return;
    
    setSelectedJobForApplications(job);
    setIsLoadingApplications(true);
    
    try {
      const apps = await sdk.getJobApplications(job.id);
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setSaveStatus({ type: 'error', message: 'Failed to load applications' });
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleCloseApplications = () => {
    setSelectedJobForApplications(null);
    setApplications([]);
  };

  const handleToggleJobStatus = async (job: Job) => {
    // Job status toggle will be implemented when smart contract supports it
    const newStatus = job.isActive ? 'inactive' : 'active';
    alert(`Mark "${job.title}" as ${newStatus}?\n\nThis feature requires a smart contract update and will be available soon.`);
  };

  const handleHire = async (application: ApplicationProfile) => {
    if (!sdk || !userAddress) {
      setSaveStatus({ type: 'error', message: 'SDK not initialized' });
      return;
    }

    try {
      // Get EmployerCap for this job
      const caps = await sdk.getEmployerCaps(userAddress);
      const employerCap = caps.find(cap => cap.jobId === application.jobId);

      if (!employerCap) {
        setSaveStatus({ type: 'error', message: 'Employer capability not found for this job' });
        return;
      }

      // Find candidate index in applications
      const jobApplications = await sdk.getJobApplications(application.jobId);
      const candidateIndex = jobApplications.findIndex(app => app.candidate === application.candidate);

      if (candidateIndex === -1) {
        setSaveStatus({ type: 'error', message: 'Could not determine candidate index' });
        return;
      }

      // Create hire transaction
      const tx = sdk.createHireCandidateTransaction({
        jobId: application.jobId,
        employerCapId: employerCap.id,
        candidateAddress: application.candidate,
        candidateIndex,
      });

      // Execute transaction
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            setSaveStatus({ type: 'success', message: 'Candidate hired successfully!' });
            
            // Refresh jobs list
            if (userAddress) {
              const jobs = await sdk.getJobsByEmployer(userAddress);
              setPostedJobs(jobs);
            }
            
            // Close modal
            handleCloseApplications();
          },
          onError: (error) => {
            console.error('Error hiring candidate:', error);
            setSaveStatus({ type: 'error', message: 'Failed to hire candidate' });
          },
        }
      );
    } catch (error) {
      console.error('Error in handleHire:', error);
      setSaveStatus({ type: 'error', message: 'An error occurred while hiring' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="employer-profile-container">
        <div className="employer-profile-not-authenticated">
          <h2>Authentication Required</h2>
          <p>Please connect your wallet to view or edit your employer profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="employer-profile-container">
        <div className="employer-profile-loading">
          <div className="spinner"></div>
          <p>Loading employer profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employer-profile-container">
      <div className="employer-profile-header">
        <div>
          <h1>{profileId ? 'Employer Profile' : 'Create Employer Profile'}</h1>
          {profileId && <p className="employer-profile-status">Profile ID: {profileId.slice(0, 8)}...{profileId.slice(-6)}</p>}
        </div>
        {profileId && (
          <>
            {!isEditMode ? (
              <button className="edit-button" onClick={() => setIsEditMode(true)}>
                Edit Profile
              </button>
            ) : (
              <button className="cancel-button" onClick={() => setIsEditMode(false)}>
                ✖ Cancel
              </button>
            )}
          </>
        )}
      </div>

      <div className="employer-profile-content">
        {/* Posted Jobs Section - Show by default, hide when in edit mode */}
        {!isEditMode && (
          <div className="employer-profile-section">
            <h2>Posted Jobs</h2>
            {isLoadingJobs ? (
              <div className="jobs-loading">
                <div className="spinner"></div>
                <p>Loading your posted jobs...</p>
              </div>
            ) : postedJobs.length === 0 ? (
              <div className="no-jobs">
                <p>You haven't posted any jobs yet.</p>
                <p>Go to <strong>Post Job</strong> to create your first job posting!</p>
              </div>
            ) : (
              <div className="posted-jobs-list">
                {postedJobs.map((job) => (
                  <div key={job.id} className="posted-job-card">
                    <div className="posted-job-header">
                      <h3>{job.title}</h3>
                      <span className={`job-status-badge ${job.isActive ? 'active' : 'closed'}`}>
                        {job.isActive ? '🟢 Active' : '🔴 Closed'}
                      </span>
                    </div>
                    <p className="posted-job-description">{job.description}</p>
                    <div className="posted-job-stats">
                      <span>📊 {job.applicationCount} applications</span>
                      {job.salary && <span>💰 ${job.salary.toLocaleString()}</span>}
                      <span>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                    {job.hiredCandidate && (
                      <div className="hired-badge">
                        ✅ Position filled
                      </div>
                    )}
                    <div className="job-actions">
                      <button 
                        className="view-applications-btn"
                        onClick={() => handleViewApplications(job)}
                        disabled={job.applicationCount === 0}
                      >
                        👥 View Applications ({job.applicationCount})
                      </button>
                      <button 
                        className="toggle-status-btn"
                        onClick={() => handleToggleJobStatus(job)}
                        disabled={!!job.hiredCandidate}
                      >
                        {job.isActive ? '⏸️ Mark Inactive' : '▶️ Mark Active'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Edit Form - Only show when in edit mode */}
        {isEditMode && (
          <>
            {/* Company Logo */}
            <div className="employer-profile-avatar-section">
              {profileData.logoUrl ? (
                <img src={profileData.logoUrl} alt="Company Logo" className="employer-profile-avatar" />
              ) : (
                <div className="employer-profile-avatar-placeholder">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="40" fill="#f0f0f0" />
                    <path d="M40 20 L50 35 H30 Z M25 40 H55 V60 H25 Z" fill="#999" />
                  </svg>
                </div>
              )}
              <div className="employer-profile-field">
                <label htmlFor="logoUrl">Company Logo URL</label>
                <input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={profileData.logoUrl}
                  onChange={(e) => setProfileData({ ...profileData, logoUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="employer-profile-section">
              <h2>Basic Information</h2>

              <div className="employer-profile-field">
                <label>Wallet Address</label>
                <div className="employer-profile-value wallet-address">{userAddress}</div>
              </div>

              <div className="employer-profile-field">
                <label htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Enter company name"
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                />
              </div>

              <div className="employer-profile-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Tell us about your company..."
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="employer-profile-field">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                />
              </div>

              <div className="employer-profile-field">
                <label htmlFor="industry">Industry</label>
                <input
                  id="industry"
                  type="text"
                  placeholder="e.g., Technology, Finance, Healthcare"
                  value={profileData.industry}
                  onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                />
              </div>

              <div className="employer-profile-field">
                <label htmlFor="employeeCount">Employee Count</label>
                <input
                  id="employeeCount"
                  type="number"
                  min="1"
                  placeholder="Number of employees"
                  value={profileData.employeeCount || ''}
                  onChange={(e) => setProfileData({ ...profileData, employeeCount: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="employer-profile-field">
                <label htmlFor="foundedYear">Founded Year</label>
                <input
                  id="foundedYear"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="Year founded"
                  value={profileData.foundedYear || ''}
                  onChange={(e) => setProfileData({ ...profileData, foundedYear: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
            </div>
          </>
        )}

        {/* Save/Cancel buttons */}
        {isEditMode && (
          <div className="employer-profile-actions">
            {saveStatus && (
              <div className={`save-status ${saveStatus.type}`}>
                {saveStatus.message}
              </div>
            )}
            <button
              className="save-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (profileId ? 'Save Employer Profile' : 'Create Employer Profile')}
            </button>
          </div>
        )}
      </div>

      {/* Applications Modal */}
      {selectedJobForApplications && sdk && (
        <ApplicationsModal
          job={selectedJobForApplications}
          applications={applications}
          sdk={sdk}
          isLoading={isLoadingApplications}
          onClose={handleCloseApplications}
          onHire={handleHire}
        />
      )}
    </div>
  );
}
