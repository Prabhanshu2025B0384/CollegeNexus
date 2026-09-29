package com.college.club.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseStorageService.class);
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

    @Value("${app.supabase.s3.endpoint:${SUPABASE_S3_ENDPOINT:https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3}}")
    private String s3Endpoint;

    @Value("${app.supabase.s3.region:${SUPABASE_S3_REGION:ap-southeast-1}}")
    private String s3Region;

    @Value("${app.supabase.s3.access-key:${SUPABASE_S3_ACCESS_KEY:#{null}}}")
    private String s3AccessKey;

    @Value("${app.supabase.s3.secret-key:${SUPABASE_S3_SECRET_KEY:#{null}}}")
    private String s3SecretKey;

    @Value("${app.supabase.storage-bucket:${SUPABASE_STORAGE_BUCKET:SDMS}}")
    private String storageBucket;

    @Value("${app.supabase.url:${SUPABASE_URL:#{null}}}")
    private String publicBaseUrl;

    private S3Client s3Client;

    public SupabaseStorageService() {
    }

    public SupabaseStorageService(String s3Endpoint, String s3Region, String s3AccessKey, String s3SecretKey, String storageBucket, String publicBaseUrl) {
        this.s3Endpoint = s3Endpoint;
        this.s3Region = s3Region;
        this.s3AccessKey = s3AccessKey;
        this.s3SecretKey = s3SecretKey;
        this.storageBucket = storageBucket;
        this.publicBaseUrl = publicBaseUrl;
    }

    // Backwards-compatible constructor for existing tests
    public SupabaseStorageService(String endpointOrUrl, String accessKey, String storageBucket) {
        this.s3Endpoint = endpointOrUrl;
        this.s3Region = "ap-southeast-1";
        this.s3AccessKey = accessKey;
        this.s3SecretKey = accessKey;
        this.storageBucket = storageBucket;
        this.publicBaseUrl = endpointOrUrl;
    }

    public synchronized S3Client getS3Client() {
        if (s3Client == null) {
            if (!isConfigured()) {
                throw new IllegalStateException("Supabase S3 Storage is not configured. Please set SUPABASE_S3_ACCESS_KEY and SUPABASE_S3_SECRET_KEY.");
            }
            String cleanEndpoint = s3Endpoint.trim();
            String cleanRegion = (s3Region != null && !s3Region.trim().isEmpty()) ? s3Region.trim() : "ap-southeast-1";
            String cleanAccessKey = s3AccessKey.trim();
            String cleanSecretKey = s3SecretKey.trim();

            this.s3Client = S3Client.builder()
                    .endpointOverride(URI.create(cleanEndpoint))
                    .region(Region.of(cleanRegion))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(cleanAccessKey, cleanSecretKey)
                    ))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build())
                    .build();
        }
        return s3Client;
    }

    public void setS3Client(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public boolean isConfigured() {
        return s3Endpoint != null && !s3Endpoint.trim().isEmpty() &&
               s3AccessKey != null && !s3AccessKey.trim().isEmpty() &&
               s3SecretKey != null && !s3SecretKey.trim().isEmpty();
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
            throw new IllegalStateException("Supabase S3 Storage is not configured. Please set SUPABASE_S3_ACCESS_KEY and SUPABASE_S3_SECRET_KEY in backend/.env.");
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
        String objectKey = "events/" + UUID.randomUUID() + "." + validatedImage.extension;

        logger.info("S3_UPLOAD_START: bucket={} key={} contentType={} size={}",
                cleanBucket, objectKey, validatedImage.mimeType, fileBytes.length);

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(cleanBucket)
                    .key(objectKey)
                    .contentType(validatedImage.mimeType)
                    .build();

            getS3Client().putObject(putRequest, RequestBody.fromBytes(fileBytes));

            String publicUrl = buildPublicUrl(cleanBucket, objectKey);
            logger.info("SECURITY_AUDIT: IMAGE_UPLOADED_S3 bucket={} key={} format={} size={}",
                    cleanBucket, objectKey, validatedImage.extension, fileBytes.length);
            return publicUrl;
        } catch (S3Exception e) {
            logger.error("Supabase S3 upload failed (AWS S3Exception): status={} code={} message={}",
                    e.statusCode(), e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : "N/A", e.getMessage());
            throw new IllegalStateException("Failed to upload image to Supabase S3: " + e.getMessage(), e);
        } catch (Exception e) {
            if (e instanceof IllegalStateException || e instanceof IllegalArgumentException) {
                throw (RuntimeException) e;
            }
            logger.error("Unexpected error during Supabase S3 file upload: {}", e.getMessage());
            throw new IllegalStateException("Image upload failed due to a storage service error.", e);
        }
    }

    public String buildPublicUrl(String bucket, String objectKey) {
        String base = publicBaseUrl;
        if (base == null || base.trim().isEmpty()) {
            if (s3Endpoint != null && !s3Endpoint.trim().isEmpty()) {
                // e.g. https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3 -> https://vshsmnrzeusimlcemzhc.supabase.co
                base = s3Endpoint.trim().replace(".storage.supabase.co/storage/v1/s3", ".supabase.co")
                        .replace("/storage/v1/s3", "");
            } else {
                base = "https://vshsmnrzeusimlcemzhc.supabase.co";
            }
        }
        String cleanBase = base.trim().replaceAll("/+$", "");
        return cleanBase + "/storage/v1/object/public/" + bucket + "/" + objectKey;
    }

    /**
     * Safely deletes an image object from Supabase S3 storage given its public URL or object key.
     * Skips non-S3/external URLs (e.g. Unsplash stock photos).
     *
     * @param imageUrlOrKey Public URL or storage object key (e.g. "events/uuid.jpg")
     * @return true if deleted or skipped (non-S3), false if S3 deletion failed
     */
    public boolean deleteImage(String imageUrlOrKey) {
        if (imageUrlOrKey == null || imageUrlOrKey.trim().isEmpty()) {
            return true;
        }

        String objectKey = extractObjectKey(imageUrlOrKey);
        if (objectKey == null) {
            logger.info("STORAGE_CLEANUP: Skipping delete for non-Supabase-S3 image URL: {}", imageUrlOrKey);
            return true;
        }

        if (!isConfigured()) {
            logger.warn("STORAGE_CLEANUP_WARN: Storage not configured. Cannot delete S3 object: {}", objectKey);
            return false;
        }

        String cleanBucket = (storageBucket != null && !storageBucket.trim().isEmpty()) ? storageBucket.trim() : "SDMS";
        try {
            logger.info("S3_DELETE_START: bucket={} key={}", cleanBucket, objectKey);
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(cleanBucket)
                    .key(objectKey)
                    .build();

            getS3Client().deleteObject(deleteRequest);
            logger.info("SECURITY_AUDIT: IMAGE_DELETED_S3 bucket={} key={}", cleanBucket, objectKey);
            return true;
        } catch (S3Exception e) {
            logger.error("Supabase S3 delete failed (AWS S3Exception): status={} code={} message={} key={}",
                    e.statusCode(), e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : "N/A", e.getMessage(), objectKey);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error during Supabase S3 file deletion for key={}: {}", objectKey, e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the object key (e.g. "events/uuid.jpg") from a URL or key string.
     * Returns null if the URL is not a Supabase storage URL belonging to the configured bucket.
     */
    public String extractObjectKey(String imageUrlOrKey) {
        if (imageUrlOrKey == null || imageUrlOrKey.trim().isEmpty()) {
            return null;
        }
        String trimmed = imageUrlOrKey.trim();

        // If already in "events/..." format
        if (trimmed.startsWith("events/")) {
            return trimmed;
        }

        String cleanBucket = (storageBucket != null && !storageBucket.trim().isEmpty()) ? storageBucket.trim() : "SDMS";
        String pattern = "/storage/v1/object/public/" + cleanBucket + "/";
        int idx = trimmed.indexOf(pattern);
        if (idx != -1) {
            return trimmed.substring(idx + pattern.length());
        }

        // Also check if bucket prefix without leading slash
        String altPattern = cleanBucket + "/events/";
        int altIdx = trimmed.indexOf(altPattern);
        if (altIdx != -1) {
            return trimmed.substring(altIdx + cleanBucket.length() + 1);
        }

        return null;
    }

    /**
     * Inspects the initial header bytes of the file to verify format:
     * - JPEG: FF D8 FF
     * - PNG: 89 50 4E 47 0D 0A 1A 0A
     * - WebP: RIFF .... WEBP
     * Rejects SVG, HTML, PDF, executable binaries, and unknown formats.
     */
    public ValidatedImage detectAndValidateImageFormat(byte[] bytes) {
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
