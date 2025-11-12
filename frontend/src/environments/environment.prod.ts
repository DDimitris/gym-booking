export const environment = {
  production: true,
  apiUrl: '/api',
  keycloak: {
    // Use same-origin proxy under /auth; nginx forwards to Keycloak and preserves /auth prefix
    url: '/auth',
    realm: 'gym-booking',
    clientId: 'gym-booking-client'
  },
  showAuthDebug: false
};