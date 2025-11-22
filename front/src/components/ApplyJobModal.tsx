import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { MiniHubSDK, Job } from '../sdk/minihub-sdk-simple';
import './ApplyJobModal.css';

interface ApplyJobModalProps {
  job: Job;
  onClose: () => void;
}

export function ApplyJobModal({ job, onClose }: ApplyJobModalProps) {
  const walletAccount = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const userAddress = walletAccount?.address;

  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverMessage: '',
    cvUrl: '',
  });
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
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

        const profile = await sdk.getUserProfileByAddress(userAddress);
        if (profile) {
          setUserProfileId(profile.id);
          console.log('✅ User profile loaded for application:', profile.id);
        } else {
          console.log('⚠️ No user profile found');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [userAddress, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userAddress) {
      setSubmitStatus({ type: 'error', message: 'Please connect your wallet' });
      return;
    }

    if (!userProfileId) {
      setSubmitStatus({ type: 'error', message: 'You need to create a user profile first. Go to Profile page.' });
      return;
    }

    if (!applicationData.coverMessage.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please write a cover message' });
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

      const tx = sdk.createApplyToJobTransaction({
        jobId: job.id,
        userProfileId: userProfileId,
        coverMessage: applicationData.coverMessage,
        cvUrl: applicationData.cvUrl,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Application submitted successfully:', result);
            setSubmitStatus({ type: 'success', message: 'Application submitted successfully! 🎉' });
            setTimeout(() => {
              onClose();
            }, 2000);
          },
          onError: (error) => {
            console.error('❌ Error submitting application:', error);
            setSubmitStatus({ type: 'error', message: 'Failed to submit application. Please try again.' });
          },
        }
      );
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      setSubmitStatus({ type: 'error', message: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply to {job.title}</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>

        {isLoadingProfile ? (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        ) : !userProfileId ? (
          <div className="modal-error">
            <p>⚠️ You need to create a user profile before applying to jobs.</p>
            <p>Go to the <strong>Profile</strong> page to create one.</p>
            <button className="secondary-button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="apply-form">
            <div className="form-field">
              <label htmlFor="coverMessage">
                Cover Message <span className="required">*</span>
              </label>
              <textarea
                id="coverMessage"
                placeholder="Tell the employer why you're a great fit for this role..."
                value={applicationData.coverMessage}
                onChange={(e) => setApplicationData({ ...applicationData, coverMessage: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="cvUrl">CV/Resume URL</label>
              <input
                id="cvUrl"
                type="url"
                placeholder="https://example.com/my-cv.pdf (optional)"
                value={applicationData.cvUrl}
                onChange={(e) => setApplicationData({ ...applicationData, cvUrl: e.target.value })}
              />
              <small>Optional: Link to your CV, portfolio, or LinkedIn profile</small>
            </div>

            {submitStatus && (
              <div className={`submit-status ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
