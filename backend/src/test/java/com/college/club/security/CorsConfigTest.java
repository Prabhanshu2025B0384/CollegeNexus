package com.college.club.security;

import com.college.club.config.CorsConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    private CorsConfig corsConfig;
    private CorsConfigurationSource corsConfigurationSource;
    private CorsFilter corsFilter;

    @BeforeEach
    void setUp() {
        corsConfig = new CorsConfig();
        corsConfigurationSource = corsConfig.corsConfigurationSource();
        corsFilter = new CorsFilter(corsConfigurationSource);
    }

    @Test
    @DisplayName("Preflight OPTIONS from production origin https://college-nexus-gold.vercel.app is allowed")
    void testPreflightOptionsFromProductionOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/events");
        request.addHeader("Origin", "https://college-nexus-gold.vercel.app");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "Content-Type, Accept");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus(), "Preflight request from production origin should return 200 OK");
        assertEquals("https://college-nexus-gold.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
        assertNotNull(response.getHeader("Access-Control-Allow-Methods"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("GET"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("POST"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("PUT"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("DELETE"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("OPTIONS"));
        assertFalse(response.getHeader("Access-Control-Allow-Methods").contains("PATCH"), "PATCH should not be allowed as it is not used");
        assertNotNull(response.getHeader("Access-Control-Allow-Headers"));
        assertNull(response.getHeader("Access-Control-Allow-Credentials"), "Credentials should not be enabled for Bearer JWT auth");
    }

    @Test
    @DisplayName("Preflight OPTIONS from local development origin http://localhost:5173 is preserved")
    void testPreflightOptionsFromLocalhostOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/events");
        request.addHeader("Origin", "http://localhost:5173");
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "Authorization, Content-Type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals("http://localhost:5173", response.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Preflight OPTIONS from arbitrary unauthorized origin is rejected with 403")
    void testPreflightOptionsFromUnauthorizedOriginRejected() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/events");
        request.addHeader("Origin", "https://unauthorized-malicious-site.com");
        request.addHeader("Access-Control-Request-Method", "GET");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus(), "Arbitrary origin preflight should be rejected with 403 Forbidden");
        assertNull(response.getHeader("Access-Control-Allow-Origin"), "Unauthorized origin should not receive Access-Control-Allow-Origin header");
    }

    @Test
    @DisplayName("Actual GET /api/events with production origin contains Access-Control-Allow-Origin")
    void testActualGetEventsFromProductionOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/events");
        request.addHeader("Origin", "https://college-nexus-gold.vercel.app");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals("https://college-nexus-gold.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
        assertNull(response.getHeader("Access-Control-Allow-Credentials"));
    }

    @Test
    @DisplayName("Actual GET /api/events/categories with production origin contains Access-Control-Allow-Origin")
    void testActualGetCategoriesFromProductionOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/events/categories");
        request.addHeader("Origin", "https://college-nexus-gold.vercel.app");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals("https://college-nexus-gold.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Actual POST /api/auth/login with production origin contains Access-Control-Allow-Origin")
    void testActualPostLoginFromProductionOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("Origin", "https://college-nexus-gold.vercel.app");
        request.addHeader("Content-Type", "application/json");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals("https://college-nexus-gold.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Actual GET request with unauthorized origin does NOT receive Access-Control-Allow-Origin")
    void testActualGetFromUnauthorizedOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/events");
        request.addHeader("Origin", "https://unauthorized-attacker.com");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertNull(response.getHeader("Access-Control-Allow-Origin"), "Unauthorized origin must NOT receive Access-Control-Allow-Origin");
    }

    @Test
    @DisplayName("CORS configuration does NOT use wildcard origins and disables credentials")
    void testCorsConfigurationProperties() {
        CorsConfiguration config = corsConfigurationSource.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/events"));
        assertNotNull(config);

        List<String> allowedOrigins = config.getAllowedOrigins();
        assertNotNull(allowedOrigins);
        assertFalse(allowedOrigins.contains("*"), "Must never use wildcard origin '*'");
        assertNull(config.getAllowedOriginPatterns(), "Must never use wildcard origin patterns");

        assertFalse(Boolean.TRUE.equals(config.getAllowCredentials()), "Credentials must NOT be enabled unnecessarily for Bearer JWT");

        assertTrue(allowedOrigins.contains("https://college-nexus-gold.vercel.app"));
        assertTrue(allowedOrigins.contains("http://localhost:5173"));

        List<String> allowedMethods = config.getAllowedMethods();
        assertEquals(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"), allowedMethods);
    }

    @Test
    @DisplayName("Trailing slashes and surrounding quotes in configured origins are sanitized")
    void testOriginSanitization() {
        CorsConfig customCorsConfig = new CorsConfig("\"https://custom-domain.com/\", 'http://another-domain.com'");
        CorsConfiguration config = customCorsConfig.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest("GET", "/api/events"));
        assertNotNull(config);

        List<String> origins = config.getAllowedOrigins();
        assertNotNull(origins);
        assertTrue(origins.contains("https://custom-domain.com"), "Trailing slashes and quotes should be stripped");
        assertTrue(origins.contains("http://another-domain.com"), "Quotes should be stripped");
        assertTrue(origins.contains("https://college-nexus-gold.vercel.app"), "Production origin always present");
        assertTrue(origins.contains("http://localhost:5173"), "Localhost dev origin always present");
    }
}
