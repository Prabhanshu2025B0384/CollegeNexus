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

        String jdbcUrl = databaseUrl.trim();

        /*
         * Render/Supabase provides:
         *
         * postgresql://user:password@host:5432/database?sslmode=require
         *
         * PostgreSQL JDBC requires:
         *
         * jdbc:postgresql://user:password@host:5432/database?sslmode=require
         *
         * We do NOT parse the URL ourselves.
         */
        if (jdbcUrl.startsWith("postgresql://")) {
            jdbcUrl = "jdbc:" + jdbcUrl;
        } else if (jdbcUrl.startsWith("postgres://")) {
            jdbcUrl = "jdbc:postgresql://" +
                    jdbcUrl.substring("postgres://".length());
        } else if (!jdbcUrl.startsWith("jdbc:postgresql://")) {
            throw new IllegalArgumentException(
                    "DATABASE_URL must be a PostgreSQL connection URL"
            );
        }

        // Require SSL for remote Supabase PostgreSQL.
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl += jdbcUrl.contains("?")
                    ? "&sslmode=require"
                    : "?sslmode=require";
        }

        HikariConfig hikariConfig = new HikariConfig();

        hikariConfig.setDriverClassName("org.postgresql.Driver");
        hikariConfig.setJdbcUrl(jdbcUrl);

        /*
         * Connection pool configuration
         */
        hikariConfig.setMaximumPoolSize(10);
        hikariConfig.setMinimumIdle(2);

        hikariConfig.setConnectionTimeout(30_000);
        hikariConfig.setValidationTimeout(5_000);

        hikariConfig.setIdleTimeout(300_000);
        hikariConfig.setMaxLifetime(600_000);

        /*
         * Validate connections before handing them to the application.
         */
        hikariConfig.setConnectionTestQuery("SELECT 1");

        logger.info(
                "Initializing PostgreSQL DataSource from DATABASE_URL"
        );

        return new HikariDataSource(hikariConfig);
    }
}