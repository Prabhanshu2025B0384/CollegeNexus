package com.college.club.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * In-memory IP-based rate limiting filter for sensitive endpoints:
 * - POST /api/auth/login: max 5 requests per minute per IP
 * - POST /api/events/{id}/registrations: max 10 requests per minute per IP
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final Pattern REGISTRATION_PATH_PATTERN = Pattern.compile("^/api/events/\\d+/registrations$");

    private final Map<String, TokenBucket> loginLimiters = new ConcurrentHashMap<>();
    private final Map<String, TokenBucket> registrationLimiters = new ConcurrentHashMap<>();

    private static class TokenBucket {
        private final long capacity;
        private final double refillTokensPerMs;
        private double availableTokens;
        private long lastRefillTimestamp;

        public TokenBucket(long capacity, long refillTokens, Duration period) {
            this.capacity = capacity;
            this.refillTokensPerMs = (double) refillTokens / period.toMillis();
            this.availableTokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (availableTokens >= 1.0) {
                availableTokens -= 1.0;
                return true;
            }
            return false;
        }

        public synchronized long getSecondsUntilNextToken() {
            refill();
            if (availableTokens >= 1.0) {
                return 0;
            }
            double missing = 1.0 - availableTokens;
            long ms = (long) Math.ceil(missing / refillTokensPerMs);
            return Math.max(1, ms / 1000);
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTimestamp;
            if (elapsed > 0) {
                availableTokens = Math.min(capacity, availableTokens + (elapsed * refillTokensPerMs));
                lastRefillTimestamp = now;
            }
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String method = request.getMethod();
        String uri = request.getRequestURI();

        if ("POST".equalsIgnoreCase(method)) {
            if ("/api/auth/login".equals(uri)) {
                String clientIp = resolveClientIp(request);
                TokenBucket bucket = loginLimiters.computeIfAbsent(clientIp, k -> new TokenBucket(5, 5, Duration.ofMinutes(1)));
                if (!bucket.tryConsume()) {
                    long retryAfter = bucket.getSecondsUntilNextToken();
                    logger.warn("SECURITY_AUDIT: RATE_LIMIT_EXCEEDED endpoint=/api/auth/login ip={} retryAfter={}s", clientIp, retryAfter);
                    sendRateLimitResponse(response, retryAfter, "Too many login attempts. Please wait " + retryAfter + " seconds before trying again.");
                    return;
                }
            } else if (REGISTRATION_PATH_PATTERN.matcher(uri).matches()) {
                String clientIp = resolveClientIp(request);
                TokenBucket bucket = registrationLimiters.computeIfAbsent(clientIp, k -> new TokenBucket(10, 10, Duration.ofMinutes(1)));
                if (!bucket.tryConsume()) {
                    long retryAfter = bucket.getSecondsUntilNextToken();
                    logger.warn("SECURITY_AUDIT: RATE_LIMIT_EXCEEDED endpoint={} ip={} retryAfter={}s", uri, clientIp, retryAfter);
                    sendRateLimitResponse(response, retryAfter, "Event registration rate limit exceeded. Please wait " + retryAfter + " seconds before trying again.");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendRateLimitResponse(HttpServletResponse response, long retryAfterSeconds, String message) throws IOException {
        response.setStatus(429); // 429 Too Many Requests
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType("application/json;charset=UTF-8");
        String json = String.format("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"%s\"}", message);
        response.getWriter().write(json);
        response.getWriter().flush();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            String[] parts = xForwardedFor.split(",");
            if (parts.length > 0) {
                String candidate = parts[0].trim();
                if (!candidate.isEmpty()) {
                    return candidate;
                }
            }
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
