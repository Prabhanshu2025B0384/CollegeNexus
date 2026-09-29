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

    private static final Logger logger =
            LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {

        if (databaseUrl == null || databaseUrl.isBlank()) {
            throw new IllegalStateException(
                    "DATABASE_URL environment variable is not configured"
            );
        }

        String raw = databaseUrl.trim();

        // Remove PostgreSQL URL scheme.
        String withoutScheme;

        if (raw.startsWith("postgresql://")) {
            withoutScheme = raw.substring("postgresql://".length());
        } else if (raw.startsWith("postgres://")) {
            withoutScheme = raw.substring("postgres://".length());
        } else {
            throw new IllegalArgumentException(
                    "DATABASE_URL must start with postgresql:// or postgres://"
            );
        }

        /*
         * Split at the LAST '@'.
         *
         * This is important because the password may itself contain '@'.
         */
        int atIndex = withoutScheme.lastIndexOf('@');

        if (atIndex <= 0 || atIndex == withoutScheme.length() - 1) {
            throw new IllegalArgumentException(
                    "Invalid DATABASE_URL: missing credentials or host"
            );
        }

        String credentials = withoutScheme.substring(0, atIndex);
        String hostAndDatabase = withoutScheme.substring(atIndex + 1);

        // Split username and password at the FIRST ':'.
        int colonIndex = credentials.indexOf(':');

        if (colonIndex <= 0) {
            throw new IllegalArgumentException(
                    "Invalid DATABASE_URL: missing username or password"
            );
        }

        String username = credentials.substring(0, colonIndex);
        String password = credentials.substring(colonIndex + 1);

        /*
         * hostAndDatabase:
         *
         * aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
         */
        String jdbcUrl = "jdbc:postgresql://" + hostAndDatabase;

        // Ensure SSL is enabled.
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl += jdbcUrl.contains("?")
                    ? "&sslmode=require"
                    : "?sslmode=require";
        }

        HikariConfig config = new HikariConfig();

        config.setDriverClassName("org.postgresql.Driver");

        // IMPORTANT:
        // Only host/database/query goes into JDBC URL.
        config.setJdbcUrl(jdbcUrl);

        // Credentials are supplied separately.
        config.setUsername(username);
        config.setPassword(password);

        // Hikari configuration.
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30_000);
        config.setValidationTimeout(5_000);
        config.setIdleTimeout(300_000);
        config.setMaxLifetime(600_000);
        config.setConnectionTestQuery("SELECT 1");

        logger.info(
                "Initializing PostgreSQL DataSource for host: {}",
                hostAndDatabase.split("[/?]")[0]
        );

        return new HikariDataSource(config);
    }
}