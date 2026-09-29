package com.college.club.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitingFilter rateLimitingFilter,
            CustomUserDetailsService userDetailsService,
            CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.userDetailsService = userDetailsService;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable()) // Stateless JWT Bearer tokens in Authorization header
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; " +
                                "script-src 'self'; " +
                                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                                "img-src 'self' data: https:; " +
                                "font-src 'self' data: https://fonts.gstatic.com; " +
                                "connect-src 'self' https: http://localhost:8080 http://localhost:5173 https://*.supabase.co; " +
                                "frame-ancestors 'none'; " +
                                "base-uri 'self'; " +
                                "form-action 'self';"
                        ))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                        )
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(cto -> {}) // nosniff
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(permissions -> permissions.policy(
                                "camera=(), microphone=(), geolocation=(), payment=()"
                        ))
                )
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public health probe endpoint
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        // Public authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // Public event browsing endpoints
                        .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                        // Public event registration submission endpoint
                        .requestMatchers(HttpMethod.POST, "/api/events/*/registrations").permitAll()
                        // Admin restricted endpoints
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        // Any other request requires authentication
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required or token expired.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied. Administrator privileges required.\"}");
                        })
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
