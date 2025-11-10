export const environment = {
  production: true,
  apiUrl: '/api',
  keycloak: {
    // Use direct Keycloak origin in production to ensure silent SSO cookies match path/host
    // The nginx proxy at /auth can cause cookie path mismatches ("/realms" vs "/auth/realms").
    url: 'http://localhost:8180',
    realm: 'gym-booking',
    clientId: 'gym-booking-client'
  },
  showAuthDebug: false
};