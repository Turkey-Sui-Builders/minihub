import { useState, useEffect } from 'react';
import { ApplicationProfile, UserProfile, Job } from '../sdk/minihub-sdk-simple';
import { MiniHubSDK } from '../sdk/minihub-sdk-simple';
import './ApplicationsModal.css';

interface ApplicationsModalProps {
  job: Job;
  applications: ApplicationProfile[];
  sdk: MiniHubSDK;
  isLoading: boolean;
  onClose: () => void;
  onHire?: (application: ApplicationProfile) => void;
}

export function ApplicationsModal({
  job,
  applications,
  sdk,
  isLoading,
  onClose,
  onHire,
}: ApplicationsModalProps) {
  const [candidateProfiles, setCandidateProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  useEffect(() => {
    loadCandidateProfiles();
  }, [applications]);

  const loadCandidateProfiles = async () => {
    setLoadingProfiles(true);
    const profilesMap = new Map<string, UserProfile>();

    for (const app of applications) {
      try {
        const profile = await sdk.getUserProfile(app.userProfileId);
        if (profile) {
          profilesMap.set(app.userProfileId, profile);
        }
      } catch (error) {
        console.error('Error loading candidate profile:', error);
      }
    }

    setCandidateProfiles(profilesMap);
    setLoadingProfiles(false);
  };

  const handleHire = (application: ApplicationProfile) => {
    if (onHire) {
      onHire(application);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="applications-modal-overlay" onClick={onClose}>
      <div className="applications-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="applications-modal-header">
          <div>
            <h2>Applications for {job.title}</h2>
            <p className="applications-count">
              {applications.length} {applications.length === 1 ? 'application' : 'applications'}
            </p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="applications-modal-body">
          {isLoading || loadingProfiles ? (
            <div className="applications-loading">
              <div className="spinner"></div>
              <p>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="no-applications">
              <p>No applications yet</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((application) => {
                const profile = candidateProfiles.get(application.userProfileId);
                
                return (
                  <div key={application.id} className="application-card">
                    <div className="application-header">
                      <div className="candidate-info">
                        {profile?.avatarUrl && (
                          <img 
                            src={profile.avatarUrl} 
                            alt={profile.name} 
                            className="candidate-avatar"
                          />
                        )}
                        <div>
                          <h3>{profile?.name || 'Loading...'}</h3>
                          <p className="candidate-experience">
                            {profile?.experienceYears || 0} years experience
                          </p>
                        </div>
                      </div>
                      <span className="application-date">
                        {formatDate(application.timestamp)}
                      </span>
                    </div>

                    {profile && (
                      <div className="candidate-details">
                        <div className="candidate-bio">
                          <strong>Bio:</strong>
                          <p>{profile.bio}</p>
                        </div>
                        
                        {profile.skills.length > 0 && (
                          <div className="candidate-skills">
                            <strong>Skills:</strong>
                            <div className="skills-tags">
                              {profile.skills.map((skill, idx) => (
                                <span key={idx} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.portfolioUrl && (
                          <div className="candidate-portfolio">
                            <strong>Portfolio:</strong>
                            <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer">
                              {profile.portfolioUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="application-message">
                      <strong>Cover Message:</strong>
                      <p>{application.coverMessage}</p>
                    </div>

                    {application.cvUrl && (
                      <div className="application-cv">
                        <strong>CV:</strong>
                        <a href={application.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                          📄 View CV
                        </a>
                      </div>
                    )}

                    <div className="application-actions">
                      {job.hiredCandidate ? (
                        <span className="already-hired-badge">
                          {job.hiredCandidate === application.candidate ? '✓ Hired' : 'Position Filled'}
                        </span>
                      ) : (
                        <>
                          <button
                            className="hire-btn"
                            onClick={() => handleHire(application)}
                          >
                            ✓ Hire Candidate
                          </button>
                          <button className="reject-btn" disabled>
                            ✕ Reject (Coming Soon)
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="applications-modal-footer">
          <button className="close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
