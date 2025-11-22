import { useZkLogin, OAuthProvider } from '../hooks/useZkLogin';
import './ZkLoginButton.css';

interface ZkLoginButtonProps {
  provider: OAuthProvider;
  clientId: string;
  redirectUrl?: string;
}

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  twitch: 'Twitch',
};

// Google SVG logo component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const PROVIDER_ICONS: Record<OAuthProvider, JSX.Element> = {
  google: <GoogleIcon />,
  facebook: <span>📘</span>,
  twitch: <span>🎮</span>,
};

export function ZkLoginButton({ provider, clientId, redirectUrl }: ZkLoginButtonProps) {
  const { login, logout, isConnected, address, isLoading, error, provider: connectedProvider } = useZkLogin();

  const handleLogin = () => {
    login({
      provider,
      clientId,
      redirectUrl: redirectUrl || window.location.origin,
    });
  };

  // If connected with this provider, show disconnect button
  if (isConnected && connectedProvider === provider) {
    return (
      <div className="zklogin-connected">
        <div className="zklogin-info">
          <span className="zklogin-icon">{PROVIDER_ICONS[provider]}</span>
          <div className="zklogin-details">
            <span className="zklogin-provider">{PROVIDER_LABELS[provider]}</span>
            <span className="zklogin-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
        <button onClick={logout} className="zklogin-logout-btn">
          Disconnect
        </button>
      </div>
    );
  }

  // Show login button
  return (
    <div className="zklogin-container">
      <button
        onClick={handleLogin}
        disabled={isLoading || isConnected}
        className={`zklogin-btn zklogin-btn-${provider}`}
      >
        <span className="zklogin-icon">{PROVIDER_ICONS[provider]}</span>
        <span>
          {isLoading ? 'Connecting...' : `Continue with ${PROVIDER_LABELS[provider]}`}
        </span>
      </button>
      {error && <div className="zklogin-error">{error}</div>}
    </div>
  );
}

/**
 * zkLogin Panel showing Google OAuth login
 */
interface ZkLoginPanelProps {
  googleClientId?: string;
  redirectUrl?: string;
}

export function ZkLoginPanel({
  googleClientId,
  redirectUrl,
}: ZkLoginPanelProps) {
  const { isConnected, address, provider: connectedProvider, logout } = useZkLogin();

  // Check if Google is configured
  const hasGoogleProvider = !!googleClientId;

  return (
    <div className="zklogin-panel">
      <div className="zklogin-header">
        <h3>Sign in with</h3>
        <p className="zklogin-subtitle">No crypto wallet needed</p>
      </div>

      {isConnected ? (
        <div className="zklogin-connected-panel">
          <div className="zklogin-success">
            <div className="success-icon">✓</div>
            <h4>Signed in with {PROVIDER_LABELS[connectedProvider!]}</h4>
            <div className="zklogin-address-display">
              <span className="label">Sui Address:</span>
              <code>{address?.slice(0, 10)}...{address?.slice(-8)}</code>
            </div>
          </div>
          <button onClick={logout} className="zklogin-logout-btn">
            Sign Out
          </button>
        </div>
      ) : !hasGoogleProvider ? (
        <div className="zklogin-not-configured">
          <p>⚠️ zkLogin is not configured</p>
          <p className="config-help">
            Add Google OAuth Client ID to your <code>.env</code> file:
          </p>
          <pre className="config-example">
{`VITE_GOOGLE_CLIENT_ID=your-client-id`}
          </pre>
          <p className="config-help">
            See <strong>ZKLOGIN_GUIDE.md</strong> for setup instructions.
          </p>
        </div>
      ) : (
        <div className="zklogin-providers">
          <ZkLoginButton
            provider="google"
            clientId={googleClientId}
            redirectUrl={redirectUrl}
          />
        </div>
      )}
    </div>
  );
}
