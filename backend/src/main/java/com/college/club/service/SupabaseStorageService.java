package com.college.club.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseStorageService.class);
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

    @Value("${app.supabase.url:${SUPABASE_URL:#{null}}}")
    private String supabaseUrl;

    @Value("${app.supabase.service-key:${SUPABASE_SERVICE_KEY:${SUPABASE_SERVICE_ROLE_KEY:${SUPABASE_SECRET_KEY:#{null}}}}}")
    private String supabaseServiceKey;

    @Value("${app.supabase.storage-bucket:${SUPABASE_STORAGE_BUCKET:SDMS}}")
    private String storageBucket;

    private final HttpClient httpClient;

    public SupabaseStorageService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public SupabaseStorageService(String supabaseUrl, String supabaseServiceKey, String storageBucket) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseServiceKey = supabaseServiceKey;
        this.storageBucket = storageBucket;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isConfigured() {
        return supabaseUrl != null && !supabaseUrl.trim().isEmpty() &&
               supabaseServiceKey != null && !supabaseServiceKey.trim().isEmpty();
    }

    private static class ValidatedImage {
        final String extension;
        final String mimeType;

        ValidatedImage(String extension, String mimeType) {
            this.extension = extension;
            this.mimeType = mimeType;
        }
    }

    public String uploadImage(MultipartFile file) {
        if (!isConfigured()) {
            throw new IllegalStateException("Supabase Storage is not configured. Please set SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY).");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5MB.");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read uploaded file content.", e);
        }

        // Validate image signature / magic bytes (Strict: JPEG, PNG, WebP only)
        ValidatedImage validatedImage = detectAndValidateImageFormat(fileBytes);

        String cleanBucket = (storageBucket != null && !storageBucket.trim().isEmpty()) ? storageBucket.trim() : "SDMS";
        String cleanBaseUrl = supabaseUrl.trim().replaceAll("/+$", "");
        String cleanKey = supabaseServiceKey.trim().replaceAll("^[\"']|[\"']$", "");
        String rawKey = cleanKey.startsWith("Bearer ") ? cleanKey.substring(7).trim() : cleanKey;
        boolean isJwt = isJwtToken(rawKey);

        if (!isJwt) {
            logger.warn("SUPABASE_KEY_FORMAT: Configured key does not appear to be a JWT. Sending 'apikey' header and omitting 'Authorization: Bearer' to avoid Compact JWS validation failure.");
        }

        // Random UUID filename with server-verified extension (prevents path traversal and extension spoofing)
        String objectPath = "events/" + UUID.randomUUID() + "." + validatedImage.extension;

        String uploadUrl = cleanBaseUrl + "/storage/v1/object/" + cleanBucket + "/" + objectPath;
        String publicUrl = cleanBaseUrl + "/storage/v1/object/public/" + cleanBucket + "/" + objectPath;

        logger.info("STORAGE_UPLOAD_START: bucket={} objectPath={} contentType={} size={}",
                cleanBucket, objectPath, validatedImage.mimeType, fileBytes.length);

        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("apikey", rawKey)
                    .header("Content-Type", validatedImage.mimeType)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                    .timeout(Duration.ofSeconds(30));

            if (isJwt) {
                requestBuilder.header("Authorization", "Bearer " + rawKey);
            }

            HttpRequest request = requestBuilder.build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("SECURITY_AUDIT: IMAGE_UPLOADED bucket={} path={} format={} size={}",
                        cleanBucket, objectPath, validatedImage.extension, fileBytes.length);
                return publicUrl;
            } else {
                String rawBody = response.body() != null ? response.body().replaceAll("[\r\n]", " ").trim() : "";
                String safeBody = rawBody.length() > 300 ? rawBody.substring(0, 300) + "..." : rawBody;
                logger.error("Supabase Storage upload failed: HTTP {} - bucket={} path={} contentType={} size={} - response={}",
                        response.statusCode(), cleanBucket, objectPath, validatedImage.mimeType, fileBytes.length, safeBody);

                String detailMessage = "Failed to upload image to storage service.";
                if (response.statusCode() == 400 && safeBody.contains("headers must have required property 'authorization'")) {
                    detailMessage = "Supabase Storage rejected upload (HTTP 400): The Supabase Storage REST API requires a valid JWT 'service_role' key in the Authorization header. Opaque 'sb_secret_' keys are not accepted by the Storage REST endpoint without a companion JWT.";
                } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                    if (safeBody.contains("Invalid Compact JWS")) {
                        detailMessage = "Supabase Storage authentication failed (HTTP " + response.statusCode() + "): Invalid Compact JWS. The configured key is not a valid JWT.";
                    } else if (safeBody.contains("Unregistered API key")) {
                        detailMessage = "Supabase Storage authentication failed (HTTP " + response.statusCode() + "): The configured SUPABASE_SERVICE_KEY is not registered for this Supabase project.";
                    } else {
                        detailMessage = "Supabase Storage access denied (HTTP " + response.statusCode() + "): " + (safeBody.isEmpty() ? "Check storage bucket permissions and service_role key." : safeBody);
                    }
                } else if (response.statusCode() == 404) {
                    detailMessage = "Supabase Storage bucket '" + cleanBucket + "' was not found (HTTP 404). Please ensure the bucket exists in Supabase.";
                }
                throw new IllegalStateException(detailMessage);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Image upload was interrupted.", e);
        } catch (Exception e) {
            if (e instanceof IllegalStateException || e instanceof IllegalArgumentException) {
                throw (RuntimeException) e;
            }
            logger.error("Unexpected error during Supabase file upload: {}", e.getMessage());
            throw new IllegalStateException("Image upload failed due to a storage service error.");
        }
    }

    /**
     * Inspects the initial header bytes of the file to verify format:
     * - JPEG: FF D8 FF
     * - PNG: 89 50 4E 47 0D 0A 1A 0A
     * - WebP: RIFF .... WEBP
     * Rejects SVG, HTML, PDF, executable binaries, and unknown formats.
     */
    private ValidatedImage detectAndValidateImageFormat(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            throw new IllegalArgumentException("Invalid file: File is too small to be a valid image.");
        }

        // JPEG check: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return new ValidatedImage("jpg", "image/jpeg");
        }

        // PNG check: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && (bytes[1] & 0xFF) == 0x50 &&
            (bytes[2] & 0xFF) == 0x4E && (bytes[3] & 0xFF) == 0x47 &&
            (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A &&
            (bytes[6] & 0xFF) == 0x1A && (bytes[7] & 0xFF) == 0x0A) {
            return new ValidatedImage("png", "image/png");
        }

        // WebP check: 'RIFF' at 0-3 and 'WEBP' at 8-11
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
            bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return new ValidatedImage("webp", "image/webp");
        }

        throw new IllegalArgumentException("Invalid file format. Only verified JPEG, PNG, and WebP images are permitted.");
    }

    /**
     * Checks if a token conforms to the Compact JWS format (three dot-separated base64 segments).
     * Modern opaque keys (such as 'sb_secret_...' or 'sb_publishable_...') return false.
     */
    public boolean isJwtToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        String clean = token.trim();
        if (clean.startsWith("sb_")) {
            return false;
        }
        int firstDot = clean.indexOf('.');
        int secondDot = firstDot != -1 ? clean.indexOf('.', firstDot + 1) : -1;
        int thirdDot = secondDot != -1 ? clean.indexOf('.', secondDot + 1) : -1;
        return firstDot > 0 && secondDot > firstDot && thirdDot == -1;
    }
}
