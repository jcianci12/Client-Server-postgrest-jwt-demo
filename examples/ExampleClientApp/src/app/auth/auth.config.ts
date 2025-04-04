/**
 * OIDC client configuration for authentication with Authentik.
 *
 * IMPORTANT:
 * 1. We use popup-based authentication (not redirect flow)
 * 2. The popup closes automatically after successful auth
 * 3. All auth state is managed through WebStorageStateStore (localStorage)
 * 4. Session management is handled through automatic silent renewal
 */
import { UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

export const getAuthSettings = (): UserManagerSettings => ({
  // Core OIDC Settings
  authority: 'https://authentik.tekonline.com.au/application/o/jobsight/',
  client_id: 'pAor9BP1Bhvllh9myJHU9hsKkmWkGEswcSXMTdWH',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email offline_access',

  // User management
  loadUserInfo: true,  // Fetch user profile after login

  // Session management - 30 minute duration
  monitorSession: true,
  automaticSilentRenew: false,  // Disable automatic renewal
  silentRequestTimeoutInSeconds: 30,
  checkSessionIntervalInSeconds: 60,  // Check session every minute
  accessTokenExpiringNotificationTimeInSeconds: 60,  // Notify 1 minute before expiry

  // Storage configuration
  stateStore: new WebStorageStateStore({ store: window.localStorage }),

  // Popup window settings
  popupWindowFeatures: {
    location: false,
    toolbar: false,
    width: 800,
    height: 600,
    left: 100,
    top: 100
  }
});
