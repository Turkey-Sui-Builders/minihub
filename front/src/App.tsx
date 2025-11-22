import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import './App.css';
import { Job } from './sdk/minihub-sdk-simple';
import { ZkLoginPanel } from './components/ZkLoginButton';
import { useZkLogin } from './hooks/useZkLogin';
import { useActiveJobs } from './hooks/useMiniHub';
import { Profile } from './pages/Profile';
import { CreateJob } from './pages/CreateJob';
import { EmployerProfile } from './pages/EmployerProfile';
import { ApplyJobModal } from './components/ApplyJobModal';
import logoImage from './img/logo.png';

// Configure query client
const queryClient = new QueryClient();

// Configure network using createNetworkConfig
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

function JobListings() {
  const walletAccount = useCurrentAccount();
  const zkLogin = useZkLogin();
  
  // Fetch jobs from blockchain using SDK
  const { data: jobs = [], isLoading, error } = useActiveJobs();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Check if user is authenticated via either method
  const isAuthenticated = !!walletAccount || zkLogin.isConnected;
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Update filtered jobs when jobs data changes
  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  // Filter logic
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, jobs]);

  return (
    <div className="job-listings-container">
      <div className="filters-section">
        <div className="search-bar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search jobs by title, employer, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="jobs-header">
        <h2>
          {isLoading ? 'Loading jobs...' : `${filteredJobs.length} ${filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found`}
        </h2>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ Error loading jobs. Make sure your smart contract is deployed and configured in .env</p>
        </div>
      )}

      <div className="jobs-grid">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className="job-type">{job.isActive ? '✓ Active' : '✗ Closed'}</span>
            </div>
            <div className="job-company">Employer: {job.employer.slice(0, 10)}...{job.employer.slice(-6)}</div>
            <div className="job-meta">
              {job.salary && (
                <span className="job-salary">💰 ${job.salary.toLocaleString()}</span>
              )}
            </div>
            <p className="job-description">{job.description}</p>
            <div className="job-stats">
              <span>📊 {job.applicationCount} applications</span>
              <span>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
            </div>
            <button 
              className="apply-btn" 
              disabled={!isAuthenticated || !job.isActive}
              onClick={() => isAuthenticated && job.isActive && setSelectedJob(job)}
            >
              {!isAuthenticated ? 'Sign In to Apply' : !job.isActive ? 'Job Closed' : 'Apply Now'}
            </button>
          </div>
        ))}
      </div>

      {selectedJob && (
        <ApplyJobModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}

      {filteredJobs.length === 0 && !isLoading && !error && (
        <div className="no-results">
          <h3>No jobs found</h3>
          <p>Try adjusting your search terms or check back later for new postings</p>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const walletAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const zkLogin = useZkLogin();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  // Check if user is authenticated via either method
  const isAuthenticated = !!walletAccount || zkLogin.isConnected;
  const userAddress = walletAccount?.address || zkLogin.address;

  // Auto-close modal after successful connection
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      const timer = setTimeout(() => {
        setShowAuthModal(false);
      }, 2000); // Close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, showAuthModal]);

  // Handle disconnect based on auth method
  const handleDisconnect = () => {
    if (zkLogin.isConnected) {
      zkLogin.logout();
    } else if (walletAccount) {
      disconnectWallet();
    }
  };

  return (
    <div className="app">
      <div className="background-gradient"></div>
      <div className="background-grid"></div>
      
      <header className="app-header">
        <Link to="/" className="logo">
          <img src={logoImage} alt="MiniHub Logo" className="logo-image" />
        </Link>
        
        <nav className="main-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Jobs
          </Link>
          <Link 
            to="/profile" 
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            Profile
          </Link>
          <Link 
            to="/employer-profile" 
            className={`nav-link ${location.pathname === '/employer-profile' ? 'active' : ''}`}
          >
            Employer
          </Link>
          <Link 
            to="/create-job" 
            className={`nav-link ${location.pathname === '/create-job' ? 'active' : ''}`}
          >
            Post Job
          </Link>
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-info">
              <span className="user-address">
                {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
              </span>
              <button 
                onClick={handleDisconnect}
                className="disconnect-btn"
              >
                {zkLogin.isConnected ? 'Sign Out' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="connect-btn">
              Connect / Sign In
            </button>
          )}
        </div>
      </header>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>
            
            <h2 className="modal-title">Connect to MiniHub</h2>
            <p className="modal-subtitle">Choose your preferred authentication method</p>

            {isAuthenticated ? (
              <div className="auth-connected-state">
                <div className="success-badge">
                  <span className="success-icon">✓</span>
                  <h3>Already Connected</h3>
                </div>
                <p className="connected-message">
                  You're connected with {zkLogin.isConnected ? 'zkLogin' : 'wallet'}
                </p>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="continue-btn"
                >
                  Continue to Jobs
                </button>
              </div>
            ) : (
              <div className="auth-options">
                <div className="auth-section">
                  <h3>Crypto Wallet</h3>
                  <p className="section-desc">Connect with your Sui wallet</p>
                  <ConnectButton />
                </div>

                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <div className="auth-section">
                  <ZkLoginPanel
                    googleClientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                    redirectUrl={import.meta.env.VITE_REDIRECT_URL || window.location.origin}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<JobListings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/employer-profile" element={<EmployerProfile />} />
          <Route path="/create-job" element={<CreateJob />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Built on Sui Network • Secure • Decentralized</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect preferredWallets={['Sui Wallet', 'Suiet', 'Ethos Wallet', 'Phantom']}>
          <Router>
            <AppContent />
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
