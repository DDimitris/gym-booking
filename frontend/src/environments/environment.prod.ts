export const environment = {
  production: true,
  apiUrl: '/api',
  keycloak: {
    // Use same-origin proxy path so all requests share origin & CSP allowances; avoids cross-origin cookie & CSP issues.
    // Nginx proxies /auth -> keycloak:8080/ so Keycloak receives expected paths.
    url: '/auth',
    realm: 'gym-booking',
    clientId: 'gym-booking-client'
  },
  showAuthDebug: true
};
