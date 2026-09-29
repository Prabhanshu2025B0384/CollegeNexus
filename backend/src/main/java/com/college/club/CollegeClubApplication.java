package com.college.club;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class CollegeClubApplication {

    private static final Logger logger = LoggerFactory.getLogger(CollegeClubApplication.class);

    public static void main(String[] args) {
        loadDotenv();
        configureDatabaseUrl();
        SpringApplication.run(CollegeClubApplication.class, args);
    }

    /**
     * Automatically loads .env file from project directories if present,
     * populating System properties for any variables not already set in the environment.
     */
    private static void loadDotenv() {
        List<Path> candidatePaths = List.of(
                Paths.get(".env"),
                Paths.get("backend/.env"),
                Paths.get("../backend/.env"),
                Paths.get("../.env")
        );

        for (Path path : candidatePaths) {
            if (Files.exists(path) && Files.isRegularFile(path)) {
                try {
                    List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    logger.info("Loaded .env configuration from: {}", path.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    logger.warn("Failed to read .env from {}: {}", path, e.getMessage());
                }
            }
        }
    }

    /**
     * Parses standard PostgreSQL URIs (DATABASE_URL) into JDBC properties
     * required by Spring Boot and PostgreSQL driver.
     * Also automatically derives SUPABASE_URL if connected to a Supabase host
     * and SUPABASE_URL was not explicitly set.
     */
    private static void configureDatabaseUrl() {
        String databaseUrl = System.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.trim().isEmpty()) {
            databaseUrl = System.getenv("DATABASE_URL");
        }

        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            String rawUrl = databaseUrl.trim();
            if (rawUrl.startsWith("postgres://")) {
                rawUrl = "postgresql://" + rawUrl.substring("postgres://".length());
            }

            if (rawUrl.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(rawUrl);
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

                    System.setProperty("spring.datasource.url", jdbcUrl);
                    System.setProperty("spring.datasource.username", username);
                    System.setProperty("spring.datasource.password", password);
                    System.setProperty("DB_URL", jdbcUrl);
                    System.setProperty("DB_USERNAME", username);
                    System.setProperty("DB_PASSWORD", password);
                    logger.info("Configured JDBC DataSource from DATABASE_URL for host: {}", host);

                    // Derive SUPABASE_URL if host or username contains Supabase project reference
                    deriveSupabaseUrlIfOmitted(host, username);
                } catch (Exception ex) {
                    logger.error("Failed to parse DATABASE_URL: {}", ex.getMessage());
                }
            }
        }
    }

    private static void deriveSupabaseUrlIfOmitted(String host, String username) {
        String existingSupabaseUrl = System.getProperty("SUPABASE_URL");
        if (existingSupabaseUrl == null || existingSupabaseUrl.trim().isEmpty()) {
            existingSupabaseUrl = System.getenv("SUPABASE_URL");
        }

        if (existingSupabaseUrl != null && !existingSupabaseUrl.trim().isEmpty()) {
            return;
        }

        String projectRef = null;
        if (host != null && host.endsWith(".supabase.co") && host.startsWith("db.")) {
            projectRef = host.substring("db.".length(), host.indexOf(".supabase.co"));
        } else if (username != null && username.startsWith("postgres.")) {
            projectRef = username.substring("postgres.".length());
        }

        if (projectRef != null && !projectRef.trim().isEmpty()) {
            String derivedUrl = "https://" + projectRef.trim() + ".supabase.co";
            System.setProperty("SUPABASE_URL", derivedUrl);
            System.setProperty("app.supabase.url", derivedUrl);
            logger.info("Automatically derived SUPABASE_URL from database connection: {}", derivedUrl);
        }
    }
}
