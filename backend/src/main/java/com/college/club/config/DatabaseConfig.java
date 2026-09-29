package com.college.club.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${spring.datasource.url:#{null}}")
    private String springUrl;

    @Value("${spring.datasource.username:#{null}}")
    private String springUsername;

    @Value("${spring.datasource.password:#{null}}")
    private String springPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        String effectiveDbUrl = databaseUrl;
        if (effectiveDbUrl == null || effectiveDbUrl.trim().isEmpty()) {
            effectiveDbUrl = System.getenv("DATABASE_URL");
        }
        if (effectiveDbUrl == null || effectiveDbUrl.trim().isEmpty()) {
            effectiveDbUrl = System.getProperty("DATABASE_URL");
        }

        if (effectiveDbUrl != null && !effectiveDbUrl.trim().isEmpty() &&
                (effectiveDbUrl.startsWith("postgresql://") || effectiveDbUrl.startsWith("postgres://"))) {
            parseAndApplyPostgresUrl(effectiveDbUrl.trim(), config);
        } else {
            // Use Spring's default properties
            config.setJdbcUrl(springUrl != null ? springUrl : "jdbc:postgresql://localhost:5432/postgres");
            config.setUsername(springUsername != null ? springUsername : "postgres");
            config.setPassword(springPassword != null ? springPassword : "");
        }

        // HikariCP connection pool settings optimized for Supabase connection pooler
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000); // 5 minutes
        config.setMaxLifetime(600000); // 10 minutes
        config.setConnectionTimeout(30000); // 30 seconds
        config.setConnectionTestQuery("SELECT 1");

        logger.info("Initializing HikariCP DataSource for PostgreSQL: {}", config.getJdbcUrl());
        return new HikariDataSource(config);
    }

    private void parseAndApplyPostgresUrl(String rawUrl, HikariConfig config) {
        try {
            String cleanUrl = rawUrl;
            if (cleanUrl.startsWith("postgres://")) {
                cleanUrl = "postgresql://" + cleanUrl.substring("postgres://".length());
            }

            URI uri = new URI(cleanUrl);
            String userInfo = uri.getUserInfo();
            String username = "";
            String password = "";
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                username = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
                password = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();
            String query = uri.getQuery();

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
            boolean isLocal = host != null && (host.equalsIgnoreCase("localhost") || host.equals("127.0.0.1") || host.equals("::1"));
            if (query != null && !query.isEmpty()) {
                jdbcUrl += "?" + query;
                if (!query.contains("sslmode") && !isLocal) {
                    jdbcUrl += "&sslmode=require";
                }
            } else if (!isLocal) {
                jdbcUrl += "?sslmode=require";
            }

            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            logger.info("Successfully parsed DATABASE_URL into JDBC connection for host: {}", host);
        } catch (Exception ex) {
            logger.error("Failed to parse DATABASE_URL, falling back to standard JDBC URL: {}", ex.getMessage());
            config.setJdbcUrl(springUrl != null ? springUrl : rawUrl);
            config.setUsername(springUsername != null ? springUsername : "");
            config.setPassword(springPassword != null ? springPassword : "");
        }
    }
}
