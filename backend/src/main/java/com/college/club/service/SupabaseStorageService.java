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

    @Value("${SUPABASE_URL:#{null}}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_KEY:#{null}}")
    private String supabaseServiceKey;

    @Value("${SUPABASE_STORAGE_BUCKET:SDMS}")
    private String storageBucket;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

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
            throw new IllegalStateException("Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
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

        String cleanBucket = storageBucket != null ? storageBucket.trim() : "SDMS";
        String cleanBaseUrl = supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
        
        // Random UUID filename with server-verified extension (prevents path traversal and extension spoofing)
        String objectPath = "events/" + UUID.randomUUID() + "." + validatedImage.extension;

        String uploadUrl = cleanBaseUrl + "/storage/v1/object/" + cleanBucket + "/" + objectPath;
        String publicUrl = cleanBaseUrl + "/storage/v1/object/public/" + cleanBucket + "/" + objectPath;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("Authorization", "Bearer " + supabaseServiceKey.trim())
                    .header("apikey", supabaseServiceKey.trim())
                    .header("Content-Type", validatedImage.mimeType)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("SECURITY_AUDIT: IMAGE_UPLOADED path={} format={}", objectPath, validatedImage.extension);
                return publicUrl;
            } else {
                logger.error("Supabase Storage upload failed with HTTP status {}", response.statusCode());
                throw new IllegalStateException("Failed to upload image to storage service.");
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
}
