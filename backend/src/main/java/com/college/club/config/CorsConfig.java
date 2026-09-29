package com.college.club.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:https://college-nexus-gold.vercel.app,http://localhost:5173}")
    private String allowedOrigins = "https://college-nexus-gold.vercel.app,http://localhost:5173";

    public CorsConfig() {
    }

    public CorsConfig(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = new java.util.ArrayList<>(
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .map(s -> s.replaceAll("^[\"']|[\"']$", ""))
                        .map(s -> s.endsWith("/") ? s.substring(0, s.length() - 1) : s)
                        .filter(s -> !s.isEmpty())
                        .distinct()
                        .toList()
        );

        if (!origins.contains("https://college-nexus-gold.vercel.app")) {
            origins.add("https://college-nexus-gold.vercel.app");
        }
        if (!origins.contains("http://localhost:5173")) {
            origins.add("http://localhost:5173");
        }

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
