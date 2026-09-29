package com.college.club.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
    }

    @Test
    @DisplayName("Should permit up to 5 login requests and rate limit the 6th with HTTP 429")
    void testLoginRateLimiting() throws ServletException, IOException {
        String clientIp = "192.168.1.100";

        // First 5 requests should pass through to filterChain
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus(), "Request " + i + " should succeed");
        }

        // 6th request from same IP should be blocked with 429 Too Many Requests
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = new MockFilterChain();

        rateLimitingFilter.doFilter(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus(), "6th request within rate window should receive 429");
        assertNotNull(blockedResponse.getHeader("Retry-After"));
        assertTrue(blockedResponse.getContentAsString().contains("Too Many Requests"));
    }

    @Test
    @DisplayName("Should permit up to 10 registration requests and rate limit the 11th with HTTP 429")
    void testRegistrationRateLimiting() throws ServletException, IOException {
        String clientIp = "10.0.0.50";

        for (int i = 1; i <= 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/events/1/registrations");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus(), "Request " + i + " should succeed");
        }

        // 11th request from same IP should receive HTTP 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/events/1/registrations");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = new MockFilterChain();

        rateLimitingFilter.doFilter(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus());
        assertTrue(blockedResponse.getContentAsString().contains("rate limit exceeded"));
    }

    @Test
    @DisplayName("Should not throttle GET requests or unmonitored endpoints")
    void testUnmonitoredRequestsNotThrottled() throws ServletException, IOException {
        String clientIp = "192.168.1.100";

        for (int i = 1; i <= 20; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/events");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
        }
    }
}
