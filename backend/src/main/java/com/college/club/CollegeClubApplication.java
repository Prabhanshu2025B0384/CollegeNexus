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
        // Render dynamically injects PORT; bind server.port immediately so Tomcat listens on the right port
        String renderPort = System.getenv("PORT");
        if (renderPort != null && !renderPort.isBlank()) {
            System.setProperty("server.port", renderPort.trim());
            System.setProperty("PORT", renderPort.trim());
            logger.info("Bound server.port to dynamic Render PORT: {}", renderPort.trim());
        }
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
            if ((rawUrl.startsWith("\"") && rawUrl.endsWith("\"")) ||
                (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
                rawUrl = rawUrl.substring(1, rawUrl.length() - 1).trim();
            }
            String withoutScheme = null;
            if (rawUrl.startsWith("postgresql://")) {
                withoutScheme = rawUrl.substring("postgresql://".length());
            } else if (rawUrl.startsWith("postgres://")) {
                withoutScheme = rawUrl.substring("postgres://".length());
            }

            if (withoutScheme != null) {
                try {
                    int atIndex = withoutScheme.lastIndexOf('@');
                    if (atIndex > 0 && atIndex < withoutScheme.length() - 1) {
                        String credentials = withoutScheme.substring(0, atIndex);
                        String hostPortDbQuery = withoutScheme.substring(atIndex + 1);

                        int colonIndex = credentials.indexOf(':');
                        String username = colonIndex > 0 ? credentials.substring(0, colonIndex) : credentials;
                        String password = colonIndex > 0 ? credentials.substring(colonIndex + 1) : "";

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
                        System.setProperty("spring.datasource.url", finalJdbcUrl);
                        System.setProperty("spring.datasource.username", username);
                        System.setProperty("spring.datasource.password", password);
                        System.setProperty("DB_URL", finalJdbcUrl);
                        System.setProperty("DB_USERNAME", username);
                        System.setProperty("DB_PASSWORD", password);
                        logger.info("Configured JDBC DataSource properties from DATABASE_URL for host: {}", host);

                        // Derive SUPABASE_URL if host or username contains Supabase project reference
                        deriveSupabaseUrlIfOmitted(host, username);

                        // Safe standalone preflight diagnostic (asynchronous & SSL-aware, never blocks startup)
                        final String diagHost = host;
                        final int diagPort = port;
                        final String diagDb = database;
                        final String diagUser = username;
                        final String diagPass = password;
                        final String diagJdbcUrl = finalJdbcUrl;
                        Thread diagnosticThread = new Thread(() -> {
                            performPreflightDiagnostic(diagHost, diagPort, diagDb, diagUser, diagPass, diagJdbcUrl);
                        }, "supabase-diagnostic");
                        diagnosticThread.setDaemon(true);
                        diagnosticThread.start();
                    }
                } catch (Exception ex) {
                    logger.error("Failed to parse DATABASE_URL: {}", ex.getMessage());
                }
            }
        }
    }

    private static void performPreflightDiagnostic(String host, int port, String database, String username, String password, String jdbcUrl) {
        logger.info("[DIAGNOSTIC] === Starting Asynchronous Database Preflight Diagnostic ===");
        // 1. DNS Resolution
        try {
            java.net.InetAddress[] addrs = java.net.InetAddress.getAllByName(host);
            StringBuilder sb = new StringBuilder();
            int v4 = 0, v6 = 0;
            for (java.net.InetAddress a : addrs) {
                if (a instanceof java.net.Inet4Address) v4++;
                else if (a instanceof java.net.Inet6Address) v6++;
                if (sb.length() > 0) sb.append(", ");
                sb.append(a.getHostAddress());
            }
            logger.info("[DIAGNOSTIC] DNS Resolution: {} IP(s) found (IPv4: {}, IPv6: {}) -> [{}]", addrs.length, v4, v6, sb);
        } catch (Exception e) {
            logger.warn("[DIAGNOSTIC] DNS Resolution note for {}: {}", host, e.getMessage());
        }

        // 2. SSL-Aware Protocol Probe (sends PostgreSQL SSLRequest instead of raw non-SSL socket)
        long probeStart = System.currentTimeMillis();
        try (java.net.Socket s = new java.net.Socket()) {
            s.connect(new java.net.InetSocketAddress(host, port), 4000);
            s.setSoTimeout(4000);
            java.io.OutputStream out = s.getOutputStream();
            // PostgreSQL SSLRequest packet: length 8, code 80877103 (0x04D2162F)
            out.write(new byte[] { 0, 0, 0, 8, 4, (byte) 210, 22, 47 });
            out.flush();
            int response = s.getInputStream().read();
            long duration = System.currentTimeMillis() - probeStart;
            if (response == 'S') {
                logger.info("[DIAGNOSTIC] Supabase SSL Probe: SUCCESS (SSL supported) in {} ms", duration);
            } else {
                logger.warn("[DIAGNOSTIC] Supabase SSL Probe: Server responded with byte '{}' ({}) in {} ms", (char) response, response, duration);
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - probeStart;
            logger.warn("[DIAGNOSTIC] Supabase SSL Probe note ({} ms): {}", duration, e.getMessage());
        }

        // 3. Direct PostgreSQL JDBC Check (No Spring, No Hikari)
        long jdbcStart = System.currentTimeMillis();
        try {
            java.util.Properties props = new java.util.Properties();
            props.setProperty("user", username);
            props.setProperty("password", password);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");
            props.setProperty("connectTimeout", "5");

            try (java.sql.Connection conn = java.sql.DriverManager.getConnection(jdbcUrl, props);
                 java.sql.Statement stmt = conn.createStatement();
                 java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 AS alive, version() AS pg_version")) {
                long jdbcDuration = System.currentTimeMillis() - jdbcStart;
                if (rs.next()) {
                    String version = rs.getString("pg_version");
                    String shortVersion = (version != null && version.contains(" on "))
                            ? version.substring(0, version.indexOf(" on "))
                            : version;
                    logger.info("[DIAGNOSTIC] Direct PostgreSQL JDBC: SUCCESS in {} ms (Database: {}, Version: {})",
                            jdbcDuration, database, shortVersion);
                }
            }
        } catch (Exception e) {
            long jdbcDuration = System.currentTimeMillis() - jdbcStart;
            logger.warn("[DIAGNOSTIC] Direct PostgreSQL JDBC check encountered: {} (in {} ms)", e.getMessage(), jdbcDuration);
        }
        logger.info("[DIAGNOSTIC] === Database Preflight Diagnostic Completed ===");
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
