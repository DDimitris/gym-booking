package com.gym.booking.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

@Component
public class SecurityLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(SecurityLoggingFilter.class);

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Only log for API write operations to avoid noise
            String uri = request.getRequestURI();
            String method = request.getMethod();
            boolean isApi = uri.startsWith("/api/");
            boolean isWrite = !"GET".equalsIgnoreCase(method);

            if (isApi && isWrite) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null) {
                    String user = String.valueOf(auth.getName());
                    String roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .sorted()
                            .collect(Collectors.joining(","));
                    if (log.isDebugEnabled()) {
                        log.debug("AuthCheck [{} {}] user='{}' roles=[{}]", method, uri, user, roles);
                    }
                } else {
                    if (log.isDebugEnabled()) {
                        log.debug("AuthCheck [{} {}] unauthenticated", method, uri);
                    }
                }
            }
        } catch (Exception e) {
            // Never break the chain due to logging
            if (log.isTraceEnabled()) {
                log.trace("SecurityLoggingFilter error", e);
            }
        }

        filterChain.doFilter(request, response);
    }
}
