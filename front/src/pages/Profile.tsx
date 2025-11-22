import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useZkLogin } from '../hooks/useZkLogin';
import { MiniHubSDK, ApplicationProfile, Job } from '../sdk/minihub-sdk-simple';
import './Profile.css';

export function Profile() {
  const walletAccount = useCurrentAccount();
  const zkLogin = useZkLogin();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const userAddress = walletAccount?.address || zkLogin.address;
  const isAuthenticated = !!walletAccount || zkLogin.isConnected;

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [applicationsWithJobs, setApplicationsWithJobs] = useState<Array<ApplicationProfile & { job?: Job }>>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    skills: [] as string[],
    experienceYears: 0,
    portfolioUrl: '',
  });
  const [profileId, setProfileId] = useState<string | null>(null);

  const [newSkill, setNewSkill] = useState('');

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      console.log('🔍 Loading profile for address:', userAddress);

      try {
        const sdkInstance = new MiniHubSDK(client, {
          packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
          jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID,
          userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
          employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID,
          clockId: '0x6',
        });

        console.log('📦 SDK Config:', {
          packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID,
          userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID,
        });

        const profile = await sdkInstance.getUserProfileByAddress(userAddress);
        
        console.log('📋 Profile fetched:', profile);

        if (profile) {
          console.log('✅ Profile found! Setting data...');
          setProfileData({
            name: profile.name,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            skills: profile.skills,
            experienceYears: profile.experienceYears,
            portfolioUrl: profile.portfolioUrl,
          });
          setProfileId(profile.id);
          console.log('✅ Profile ID set:', profile.id);

          // Load user applications
          setIsLoadingApplications(true);
          try {
            const userApps = await sdkInstance.getUserApplications(userAddress);
            console.log('✅ Loaded', userApps.length, 'applications');

            // Load job details for each application
            const appsWithJobs = await Promise.all(
              userApps.map(async (app: ApplicationProfile) => {
                try {
                  const job = await sdkInstance.getJob(app.jobId);
                  return { ...app, job: job || undefined };
                } catch (error) {
                  console.error('Error loading job for application:', error);
                  return { ...app, job: undefined };
                }
              })
            );
            setApplicationsWithJobs(appsWithJobs);
          } catch (error) {
            console.error('Error loading applications:', error);
          } finally {
            setIsLoadingApplications(false);
          }
        } else {
          console.log('⚠️ No profile found for this wallet');
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userAddress, client]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill),
    });
  };

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

      // Always update if profileId exists (profile was loaded on page load)
      // Only create if profileId is null (no profile found when wallet connected)
      let tx;
      
      if (profileId) {
        // Profile exists - UPDATE it
        console.log('Updating existing profile:', profileId);
        tx = sdk.createUpdateUserProfileTransaction({
          userProfileId: profileId,
          name: profileData.name,
          bio: profileData.bio,
          avatarUrl: profileData.avatarUrl,
          skills: profileData.skills,
          experienceYears: profileData.experienceYears,
          portfolioUrl: profileData.portfolioUrl,
        });
      } else {
        // No profile exists - CREATE new one
        console.log('Creating new profile for wallet:', userAddress);
        tx = sdk.createUserProfileTransaction({
          name: profileData.name,
          bio: profileData.bio,
          avatarUrl: profileData.avatarUrl,
          skills: profileData.skills,
          experienceYears: profileData.experienceYears,
          portfolioUrl: profileData.portfolioUrl,
        });
      }

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('✅ Profile saved successfully:', result);
            setSaveStatus({ type: 'success', message: profileId ? 'Profile updated successfully!' : 'Profile created successfully!' });
            setIsEditing(false);
            
            // Wait for transaction to be indexed, then reload profile
            console.log('⏳ Waiting for blockchain to index transaction...');
            setTimeout(async () => {
              try {
                const profile = await sdk.getUserProfileByAddress(userAddress);
                if (profile) {
                  console.log('🔄 Reloaded profile:', profile);
                  setProfileData({
                    name: profile.name,
                    bio: profile.bio,
                    avatarUrl: profile.avatarUrl,
                    skills: profile.skills,
                    experienceYears: profile.experienceYears,
                    portfolioUrl: profile.portfolioUrl,
                  });
                  setProfileId(profile.id);
                  console.log('✅ Profile data refreshed!');
                } else {
                  console.log('⚠️ Profile not found after save');
                }
              } catch (error) {
                console.error('❌ Error reloading profile:', error);
              }
            }, 3000); // Wait 3 seconds for blockchain to index
          },
          onError: (error) => {
            console.error('❌ Error saving profile:', error);
            setSaveStatus({ type: 'error', message: 'Failed to save profile. Please try again.' });
          },
        }
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      setSaveStatus({ type: 'error', message: 'Failed to create transaction.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="profile-not-authenticated">
          <h2>Authentication Required</h2>
          <p>Please connect your wallet or sign in to view your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="edit-profile-btn"
        >
          {isEditing ? '✕ Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        {/* Applications Section - Show by default, hide when editing */}
        {!isEditing && (
          <div className="profile-section">
            <h2>My Applications</h2>
            {isLoadingApplications ? (
              <div className="applications-loading">
                <div className="loading-spinner"></div>
                <p>Loading your applications...</p>
              </div>
            ) : applicationsWithJobs.length === 0 ? (
              <div className="no-applications">
                <p>You haven't applied to any jobs yet.</p>
                <p>Browse available jobs on the <strong>Jobs</strong> page!</p>
              </div>
            ) : (
              <div className="applications-list">
                {applicationsWithJobs.map((app) => (
                  <div key={app.id} className="application-card">
                    <div className="application-header">
                      <h3>{app.job?.title || 'Job Title'}</h3>
                      <span className={`application-status ${app.job?.hiredCandidate === userAddress ? 'hired' : 'pending'}`}>
                        {app.job?.hiredCandidate === userAddress ? '✅ Hired' : 
                         app.job?.hiredCandidate ? '❌ Position Filled' : '⏳ Pending'}
                      </span>
                    </div>
                    {app.job && (
                      <>
                        <p className="application-job-description">{app.job.description}</p>
                        <div className="application-details">
                          <span>💰 {app.job.salary ? `$${app.job.salary.toLocaleString()}` : 'Not specified'}</span>
                          <span>📅 Deadline: {new Date(app.job.deadline).toLocaleDateString()}</span>
                          <span>📊 {app.job.applicationCount} applicants</span>
                        </div>
                      </>
                    )}
                    <div className="application-info">
                      <p><strong>Your Cover Message:</strong></p>
                      <p className="cover-message">{app.coverMessage}</p>
                      {app.cvUrl && (
                        <p>
                          <strong>CV:</strong>{' '}
                          <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                            📄 View CV
                          </a>
                        </p>
                      )}
                      <p className="application-date">
                        Applied on: {new Date(app.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Edit Form - Only show when editing */}
        {isEditing && (
          <>
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : '👤'}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Avatar URL"
                value={profileData.avatarUrl}
                onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                className="profile-input"
              />
            </div>

            {/* Basic Info */}
            <div className="profile-section">
              <h2>Basic Information</h2>
              <div className="profile-field">
                <label>Wallet Address</label>
                <div className="profile-address">
                  {userAddress?.slice(0, 10)}...{userAddress?.slice(-8)}
                </div>
              </div>

              <div className="profile-field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="profile-input"
                />
              </div>

              <div className="profile-field">
                <label>Bio</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="profile-textarea"
                  rows={4}
                />
              </div>

              <div className="profile-field">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Years of experience"
                  value={profileData.experienceYears}
                  onChange={(e) => setProfileData({ ...profileData, experienceYears: parseInt(e.target.value) || 0 })}
                  className="profile-input"
                />
              </div>

              <div className="profile-field">
                <label>Portfolio URL</label>
                <input
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={profileData.portfolioUrl}
                  onChange={(e) => setProfileData({ ...profileData, portfolioUrl: e.target.value })}
                  className="profile-input"
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="profile-section">
              <h2>Skills</h2>
              <div className="skills-container">
                {profileData.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      className="remove-skill-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-skill-section">
                <input
                  type="text"
                  placeholder="Add a skill (e.g., React, Solidity)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="profile-input"
                />
                <button onClick={handleAddSkill} className="add-skill-btn">
                  + Add Skill
                </button>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        {isEditing && (
          <div className="profile-actions">
            {saveStatus && (
              <div className={`save-status ${saveStatus.type}`}>
                {saveStatus.message}
              </div>
            )}
            <button 
              onClick={handleSave} 
              className="save-profile-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
