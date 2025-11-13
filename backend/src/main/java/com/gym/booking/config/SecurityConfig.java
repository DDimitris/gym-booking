package com.gym.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, SecurityLoggingFilter securityLoggingFilter)
            throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource(null)))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/classes/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/class-types/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/bookings/class/*/count")
                        .permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .addFilterAfter(securityLoggingFilter, SecurityContextHolderFilter.class);

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") String jwkSetUri,
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:http://keycloak:8080/auth/realms/gym-booking}") String issuer) {
        if (jwkSetUri != null && !jwkSetUri.isBlank()) {
            return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        }
        return JwtDecoders.fromIssuerLocation(issuer);
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            java.util.Set<String> roleNames = new java.util.LinkedHashSet<>();

            // Standard Keycloak realm_access.roles
            Object realmAccess = jwt.getClaims().get("realm_access");
            if (realmAccess instanceof java.util.Map<?, ?> realm) {
                Object rolesObj = realm.get("roles");
                if (rolesObj instanceof java.util.Collection<?> roles) {
                    for (Object r : roles) {
                        if (r != null)
                            roleNames.add(String.valueOf(r));
                    }
                }
            }

            // Also gather client roles from resource_access.<client>.roles
            Object resourceAccess = jwt.getClaims().get("resource_access");
            if (resourceAccess instanceof java.util.Map<?, ?> resources) {
                for (Object entryObj : resources.values()) {
                    if (entryObj instanceof java.util.Map<?, ?> clientMap) {
                        Object clientRoles = clientMap.get("roles");
                        if (clientRoles instanceof java.util.Collection<?> roles) {
                            for (Object r : roles) {
                                if (r != null)
                                    roleNames.add(String.valueOf(r));
                            }
                        }
                    }
                }
            }

            // Some realm configurations (current export) map roles directly to a top-level
            // "roles" claim
            Object directRoles = jwt.getClaims().get("roles");
            if (directRoles instanceof java.util.Collection<?> roles) {
                for (Object r : roles) {
                    if (r != null)
                        roleNames.add(String.valueOf(r));
                }
            }

            java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
            for (String rawRole : roleNames) {
                String role = rawRole.toUpperCase();
                // Normalize any accidental leading ROLE_ (Keycloak or custom mappers sometimes
                // include it)
                if (role.startsWith("ROLE_")) {
                    role = role.substring(5); // strip leading ROLE_
                }
                // Legacy mapping support: INSTRUCTOR -> TRAINER, ATHLETE -> MEMBER
                if ("INSTRUCTOR".equals(role))
                    role = "TRAINER";
                if ("ATHLETE".equals(role))
                    role = "MEMBER";
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
            }
            return authorities;
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:*}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        // In dev allow all origins; in prod, pass app.cors.allowed-origins env/property
        // as comma-separated list
        List<String> originPatterns = List.of(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(originPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Location", "Link"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}