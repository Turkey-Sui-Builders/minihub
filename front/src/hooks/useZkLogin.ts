import { useState, useEffect } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { jwtToAddress } from '@mysten/sui/zklogin';

// OAuth provider configuration
export type OAuthProvider = 'google' | 'facebook' | 'twitch';

interface ZkLoginConfig {
  clientId: string;
  redirectUrl: string;
  provider: OAuthProvider;
}

// Default configurations for different providers
const OAUTH_CONFIGS: Record<OAuthProvider, { authUrl: string }> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  twitch: {
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
  },
};

interface ZkLoginState {
  isLoading: boolean;
  error: string | null;
  address: string | null;
  jwt: string | null;
  provider: OAuthProvider | null;
}

/**
 * zkLogin Hook for OAuth-based authentication
 * Allows users to sign in with Google, Facebook, or Twitch
 */
export function useZkLogin() {
  const [state, setState] = useState<ZkLoginState>({
    isLoading: false,
    error: null,
    address: null,
    jwt: null,
    provider: null,
  });

  // Check for OAuth callback on mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const idToken = params.get('id_token');
      
      if (idToken) {
        try {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          
          // Get stored nonce, provider, and randomness from session
          const nonce = sessionStorage.getItem('zklogin_nonce');
          const provider = sessionStorage.getItem('zklogin_provider') as OAuthProvider;
          const randomness = sessionStorage.getItem('zklogin_randomness');
          
          if (!nonce || !provider || !randomness) {
            throw new Error('Missing authentication data');
          }

          // Convert randomness to BigInt for salt
          const userSalt = BigInt(randomness);

          // Derive Sui address from JWT using the salt
          const address = jwtToAddress(idToken, userSalt);

          setState({
            isLoading: false,
            error: null,
            address,
            jwt: idToken,
            provider,
          });

          // Store in localStorage for persistence
          localStorage.setItem('zklogin_address', address);
          localStorage.setItem('zklogin_jwt', idToken);
          localStorage.setItem('zklogin_provider', provider);

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Clean up session storage
          sessionStorage.removeItem('zklogin_nonce');
          sessionStorage.removeItem('zklogin_provider');
        } catch (error) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          }));
        }
      } else {
        // Try to restore from localStorage
        const savedAddress = localStorage.getItem('zklogin_address');
        const savedJwt = localStorage.getItem('zklogin_jwt');
        const savedProvider = localStorage.getItem('zklogin_provider') as OAuthProvider;

        if (savedAddress && savedJwt && savedProvider) {
          setState({
            isLoading: false,
            error: null,
            address: savedAddress,
            jwt: savedJwt,
            provider: savedProvider,
          });
        }
      }
    };

    handleOAuthCallback();
  }, []);

  /**
   * Initiate zkLogin flow with OAuth provider
   */
  const login = async (config: ZkLoginConfig) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Generate ephemeral keypair and nonce
      const ephemeralKeyPair = new Ed25519Keypair();
      const randomness = generateRandomness();
      const nonce = generateNonce(
        ephemeralKeyPair.getPublicKey(),
        config.provider === 'google' ? 2 : 1, // Max epoch for key validity
        randomness
      );

      // Store nonce and provider in session for callback
      sessionStorage.setItem('zklogin_nonce', nonce);
      sessionStorage.setItem('zklogin_provider', config.provider);
      sessionStorage.setItem('zklogin_randomness', randomness);

      // Build OAuth URL
      const oauthConfig = OAUTH_CONFIGS[config.provider];
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUrl,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: nonce,
      });

      // Redirect to OAuth provider
      const authUrl = `${oauthConfig.authUrl}?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  };

  /**
   * Logout and clear stored credentials
   */
  const logout = () => {
    localStorage.removeItem('zklogin_address');
    localStorage.removeItem('zklogin_jwt');
    localStorage.removeItem('zklogin_provider');
    sessionStorage.clear();
    
    setState({
      isLoading: false,
      error: null,
      address: null,
      jwt: null,
      provider: null,
    });
  };

  return {
    ...state,
    login,
    logout,
    isConnected: !!state.address,
  };
}
