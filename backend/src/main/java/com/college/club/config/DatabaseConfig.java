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

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DB_URL:${spring.datasource.url:jdbc:postgresql://localhost:5432/postgres}}")
    private String fallbackUrl;

    @Value("${DB_USERNAME:${spring.datasource.username:postgres}}")
    private String fallbackUsername;

    @Value("${DB_PASSWORD:${spring.datasource.password:}}")
    private String fallbackPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        String effectiveUrl = (databaseUrl != null && !databaseUrl.isBlank())
                ? databaseUrl.trim()
                : (System.getenv("DATABASE_URL") != null && !System.getenv("DATABASE_URL").isBlank())
                    ? System.getenv("DATABASE_URL").trim()
                    : null;

        if (effectiveUrl != null && (effectiveUrl.startsWith("postgresql://") || effectiveUrl.startsWith("postgres://"))) {
            parseAndConfigureDatabaseUrl(effectiveUrl, config);
        } else {
            // Authoritative fallback for local development or standard properties
            String localUrl = (fallbackUrl != null && !fallbackUrl.isBlank())
                    ? fallbackUrl
                    : "jdbc:postgresql://localhost:5432/postgres";
            String localUser = (fallbackUsername != null) ? fallbackUsername : "postgres";
            String localPass = (fallbackPassword != null) ? fallbackPassword : "";

            config.setJdbcUrl(localUrl);
            config.setUsername(localUser);
            config.setPassword(localPass);

            logger.info("Initializing PostgreSQL DataSource using fallback configuration for URL: {}",
                    localUrl.contains("@") ? localUrl.substring(localUrl.indexOf('@') + 1) : localUrl);
        }

        // Conservative HikariCP pool configuration
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30_000);
        config.setValidationTimeout(5_000);
        config.setIdleTimeout(300_000);
        config.setMaxLifetime(600_000);

        return new HikariDataSource(config);
    }

    private void parseAndConfigureDatabaseUrl(String rawUrl, HikariConfig config) {
        String withoutScheme;
        if (rawUrl.startsWith("postgresql://")) {
            withoutScheme = rawUrl.substring("postgresql://".length());
        } else if (rawUrl.startsWith("postgres://")) {
            withoutScheme = rawUrl.substring("postgres://".length());
        } else {
            throw new IllegalArgumentException("DATABASE_URL must start with postgresql:// or postgres://");
        }

        int atIndex = withoutScheme.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == withoutScheme.length() - 1) {
            throw new IllegalArgumentException("Invalid DATABASE_URL: missing credentials or host");
        }

        String credentials = withoutScheme.substring(0, atIndex);
        String hostPortDbQuery = withoutScheme.substring(atIndex + 1);

        int colonIndex = credentials.indexOf(':');
        if (colonIndex <= 0) {
            throw new IllegalArgumentException("Invalid DATABASE_URL: missing username or password");
        }

        String username = credentials.substring(0, colonIndex);
        String password = credentials.substring(colonIndex + 1);

        String hostPortDb;
        String query = "";
        int questionIndex = hostPortDbQuery.indexOf('?');
        if (questionIndex >= 0) {
            hostPortDb = hostPortDbQuery.substring(0, questionIndex);
            query = hostPortDbQuery.substring(questionIndex + 1);
        } else {
            hostPortDb = hostPortDbQuery;
        }

        String hostPort;
        String database = "postgres";
        int slashIndex = hostPortDb.indexOf('/');
        if (slashIndex >= 0) {
            hostPort = hostPortDb.substring(0, slashIndex);
            String db = hostPortDb.substring(slashIndex + 1).trim();
            if (!db.isEmpty()) {
                database = db;
            }
        } else {
            hostPort = hostPortDb;
        }

        String host;
        int port = 5432;
        int hostColonIndex = hostPort.lastIndexOf(':');
        if (hostColonIndex >= 0) {
            host = hostPort.substring(0, hostColonIndex);
            try {
                port = Integer.parseInt(hostPort.substring(hostColonIndex + 1));
            } catch (NumberFormatException e) {
                port = 5432;
            }
        } else {
            host = hostPort;
        }

        StringBuilder jdbcUrl = new StringBuilder();
        jdbcUrl.append("jdbc:postgresql://").append(host).append(":").append(port).append("/").append(database);

        boolean isLocal = "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host);

        if (query.isEmpty()) {
            if (!isLocal) {
                jdbcUrl.append("?sslmode=require");
            }
        } else {
            jdbcUrl.append("?").append(query);
            if (!query.contains("sslmode=") && !isLocal) {
                jdbcUrl.append("&sslmode=require");
            }
        }

        String finalJdbcUrl = jdbcUrl.toString();

        config.setJdbcUrl(finalJdbcUrl);
        config.setUsername(username);
        config.setPassword(password);

        logger.info("Initializing PostgreSQL DataSource: host={}, port={}, database={}, sslmode=require, username={}",
                host, port, database, username);
    }
}