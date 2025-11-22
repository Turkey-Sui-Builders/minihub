# zkLogin Integration Guide

This guide explains how to set up and use zkLogin authentication in MiniHub, allowing users to sign in with OAuth providers (Google, Facebook, Twitch) instead of requiring a crypto wallet.

## What is zkLogin?

zkLogin is Sui's innovative authentication system that allows users to interact with blockchain applications using familiar OAuth login methods. It uses zero-knowledge proofs to derive a Sui address from OAuth credentials without storing private keys.

**Benefits:**
- 🚪 Lower barrier to entry - no wallet required
- 🔐 Familiar OAuth login flow (Google, Facebook, etc.)
- 🔒 Secure - uses zero-knowledge proofs
- 🌐 Web2-friendly UX with Web3 capabilities

## Architecture

```
User → OAuth Provider (Google/Facebook/Twitch) → JWT Token → zkLogin → Sui Address
```

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google returns JWT token
4. zkLogin derives Sui address from JWT + nonce
5. User can now interact with smart contracts

## Setup Instructions

### 1. Get OAuth Client IDs

You'll need to register your app with OAuth providers:

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add Authorized JavaScript origins: `http://localhost:5173` (dev) and your production URL
7. Add Authorized redirect URIs: `http://localhost:5173` (dev) and your production URL
8. Copy your **Client ID**

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add "Facebook Login" product
4. Configure OAuth Redirect URIs
5. Copy your **App ID**

#### Twitch OAuth Setup

1. Go to [Twitch Developers](https://dev.twitch.tv/console)
2. Register a new application
3. Set OAuth Redirect URL
4. Copy your **Client ID**

### 2. Configure Environment Variables

Update your `.env` file:

```bash
# zkLogin OAuth Configuration
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
VITE_FACEBOOK_CLIENT_ID=your-facebook-app-id
VITE_TWITCH_CLIENT_ID=your-twitch-client-id
```

### 3. How It Works in the App

The app now supports **dual authentication**:

- **Crypto Wallet**: Traditional wallet connection (Sui Wallet, Suiet, etc.)
- **zkLogin**: OAuth-based login (Google, Facebook, Twitch)

Users can choose either method from the authentication modal.

## Code Structure

### Hook: `useZkLogin`

Located in `src/hooks/useZkLogin.ts`

```typescript
const { 
  login,           // Initiate OAuth flow
  logout,          // Clear credentials
  isConnected,     // Authentication status
  address,         // Derived Sui address
  jwt,             // JWT token
  provider,        // OAuth provider used
  isLoading,       // Loading state
  error            // Error message
} = useZkLogin();
```

### Component: `ZkLoginButton`

Located in `src/components/ZkLoginButton.tsx`

Single provider button:
```tsx
<ZkLoginButton 
  provider="google" 
  clientId={GOOGLE_CLIENT_ID}
  redirectUrl={window.location.origin}
/>
```

### Component: `ZkLoginPanel`

Multi-provider panel:
```tsx
<ZkLoginPanel
  googleClientId={GOOGLE_CLIENT_ID}
  facebookClientId={FACEBOOK_CLIENT_ID}
  twitchClientId={TWITCH_CLIENT_ID}
  redirectUrl={window.location.origin}
/>
```

## User Flow

### First-Time Login

1. User clicks "Connect / Sign In" button
2. Authentication modal opens with two options:
   - Crypto Wallet (via ConnectButton)
   - zkLogin (Google/Facebook/Twitch)
3. User selects OAuth provider (e.g., "Continue with Google")
4. Redirected to Google OAuth consent screen
5. After approval, redirected back with JWT token
6. zkLogin derives Sui address from JWT
7. User is now authenticated and can apply to jobs

### Returning User

- Credentials stored in `localStorage`
- Auto-restored on page load
- No need to sign in again (until JWT expires or manual logout)

## Security Considerations

### JWT Storage
- JWT tokens are stored in `localStorage`
- Consider implementing token refresh mechanism
- Clear tokens on logout

### Nonce Management
- Ephemeral nonce generated per login
- Stored in `sessionStorage` during OAuth flow
- Cleared after successful authentication

### Address Derivation
```typescript
const address = jwtToAddress(idToken, nonce);
```

The Sui address is deterministically derived from:
- JWT token (contains user identity)
- Nonce (prevents replay attacks)
- Provider-specific salt

## Production Checklist

- [ ] Register app with OAuth providers (Google, Facebook, Twitch)
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Set environment variables with Client IDs
- [ ] Implement JWT refresh mechanism
- [ ] Add rate limiting for login attempts
- [ ] Implement proper error handling and user feedback
- [ ] Test on production domain
- [ ] Monitor for failed authentications

## Testing

### Local Development

1. Set up OAuth apps with `http://localhost:5173` as redirect URL
2. Update `.env` with Client IDs
3. Start dev server: `npm run dev`
4. Click "Connect / Sign In"
5. Try each OAuth provider

### Common Issues

**Issue:** "Redirect URI mismatch"
- **Solution:** Ensure OAuth app redirect URIs match exactly (including protocol and port)

**Issue:** "Nonce not found"
- **Solution:** Clear browser cache and try again. This happens if sessionStorage is cleared mid-flow.

**Issue:** "Invalid JWT"
- **Solution:** Check that OAuth provider returns `id_token` (not just `access_token`)

## Advanced: Custom Providers

To add more OAuth providers:

1. Update `OAuthProvider` type in `useZkLogin.ts`:
```typescript
export type OAuthProvider = 'google' | 'facebook' | 'twitch' | 'your-provider';
```

2. Add provider config:
```typescript
const OAUTH_CONFIGS: Record<OAuthProvider, { authUrl: string }> = {
  // ...
  'your-provider': {
    authUrl: 'https://provider.com/oauth/authorize',
  },
};
```

3. Add button styles in `ZkLoginButton.css`

## Resources

- [Sui zkLogin Documentation](https://docs.sui.io/concepts/cryptography/zklogin)
- [Sui zkLogin Examples](https://github.com/MystenLabs/sui/tree/main/sdk/zklogin)
- [OAuth 2.0 Spec](https://oauth.net/2/)

## Support

For issues specific to zkLogin:
- Check Sui Discord #zklogin channel
- Review [zkLogin FAQ](https://docs.sui.io/concepts/cryptography/zklogin#faq)

---

**Note:** zkLogin is a powerful feature but requires proper OAuth setup. Make sure to test thoroughly before going to production!
