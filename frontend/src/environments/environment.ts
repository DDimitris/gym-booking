export const environment = {
  production: false,
  apiUrl: '/api',
  keycloak: {
    // Use same-origin proxy in dev too, since we run via Docker/nginx
    url: '/auth',
    realm: 'gym-booking',
    clientId: 'gym-booking-client'
  },
  showAuthDebug: true
};