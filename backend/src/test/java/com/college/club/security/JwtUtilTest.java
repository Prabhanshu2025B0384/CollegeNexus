package com.college.club.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private static final String VALID_SECRET = "super-secret-production-key-for-campus-nexus-auth-256-bits!";
    private static final long EXPIRATION_MS = 3600000; // 1 hour
    private static final String ISSUER = "campus-nexus";
    private static final String AUDIENCE = "campus-nexus-api";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(VALID_SECRET, EXPIRATION_MS, ISSUER, AUDIENCE);
    }

    @Test
    @DisplayName("Should generate valid token and extract subject, issuer, audience, and role")
    void testGenerateAndValidateToken() {
        String token = jwtUtil.generateToken("admin@collegeclub.edu", "ROLE_ADMIN");
        assertNotNull(token);
        assertFalse(token.isEmpty());

        String username = jwtUtil.extractUsername(token);
        assertEquals("admin@collegeclub.edu", username);

        UserDetails userDetails = new User("admin@collegeclub.edu", "pass", Collections.emptyList());
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    @DisplayName("Should reject token for different user")
    void testValidateTokenWithDifferentUser() {
        String token = jwtUtil.generateToken("admin@collegeclub.edu", "ROLE_ADMIN");
        UserDetails differentUser = new User("other@collegeclub.edu", "pass", Collections.emptyList());
        assertFalse(jwtUtil.validateToken(token, differentUser));
    }

    @Test
    @DisplayName("Should fail-closed when secret is null, empty, or less than 32 bytes")
    void testSecretKeyValidationFailClosed() {
        // Null secret
        assertThrows(IllegalStateException.class, () ->
                new JwtUtil(null, EXPIRATION_MS, ISSUER, AUDIENCE)
        );

        // Empty secret
        assertThrows(IllegalStateException.class, () ->
                new JwtUtil("   ", EXPIRATION_MS, ISSUER, AUDIENCE)
        );

        // Weak secret (< 32 bytes)
        assertThrows(IllegalStateException.class, () ->
                new JwtUtil("short-secret-12345", EXPIRATION_MS, ISSUER, AUDIENCE)
        );
    }

    @Test
    @DisplayName("Should detect expired token")
    void testExpiredTokenDetection() {
        // Expired in the past (-10 seconds)
        JwtUtil expiredJwtUtil = new JwtUtil(VALID_SECRET, -10000, ISSUER, AUDIENCE);
        String expiredToken = expiredJwtUtil.generateToken("admin@collegeclub.edu", "ROLE_ADMIN");

        assertThrows(ExpiredJwtException.class, () -> jwtUtil.extractUsername(expiredToken));
    }

    @Test
    @DisplayName("Should reject token signed with different key")
    void testInvalidSignature() {
        String foreignSecret = "another-completely-different-signing-key-that-is-at-least-256-bits!";
        JwtUtil foreignUtil = new JwtUtil(foreignSecret, EXPIRATION_MS, ISSUER, AUDIENCE);
        String forgedToken = foreignUtil.generateToken("admin@collegeclub.edu", "ROLE_ADMIN");

        assertThrows(SignatureException.class, () -> jwtUtil.extractUsername(forgedToken));
    }
}
