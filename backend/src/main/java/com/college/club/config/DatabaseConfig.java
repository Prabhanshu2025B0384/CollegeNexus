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

    @Value("${spring.datasource.url:}")
    private String springUrl;

    @Value("${spring.datasource.username:}")
    private String springUsername;

    @Value("${spring.datasource.password:}")
    private String springPassword;

    @Bean
    @Primary
    public DataSource dataSource() {

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        String url = databaseUrl;

        if (url == null || url.isBlank()) {
            url = springUrl;
        }

        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "No database URL configured. Set DATABASE_URL."
            );
        }

        // Convert Supabase's standard PostgreSQL URL to JDBC format.
        if (url.startsWith("postgresql://")) {
            url = "jdbc:" + url;
        } else if (url.startsWith("postgres://")) {
            url = "jdbc:postgresql://" + url.substring("postgres://".length());
        }

        // Make sure SSL is required for remote PostgreSQL.
        if (!url.contains("sslmode=")) {
            url += url.contains("?")
                    ? "&sslmode=require"
                    : "?sslmode=require";
        }

        config.setJdbcUrl(url);

        if (springUsername != null && !springUsername.isBlank()) {
            config.setUsername(springUsername);
        }

        if (springPassword != null && !springPassword.isBlank()) {
            config.setPassword(springPassword);
        }

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(600000);
        config.setConnectionTimeout(30000);
        config.setConnectionTestQuery("SELECT 1");

        // Don't log the password-containing JDBC URL.
        logger.info(
                "Initializing PostgreSQL DataSource using configured DATABASE_URL"
        );

        return new HikariDataSource(config);
    }
}