package com.college.club.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class LiveS3UploadVerification {

    private static Map<String, String> loadEnv(String path) {
        Map<String, String> map = new HashMap<>();
        try {
            for (String line : Files.readAllLines(Paths.get(path))) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                    int eq = line.indexOf('=');
                    String k = line.substring(0, eq).trim();
                    String v = line.substring(eq + 1).trim().replace("\"", "").replace("'", "");
                    map.put(k, v);
                }
            }
        } catch (Exception ignored) {}
        return map;
    }

    @Test
    @DisplayName("Perform real JPEG upload to Supabase S3 bucket SDMS/events/ and verify accessibility")
    void testLiveUploadToSupabaseS3() throws Exception {
        Map<String, String> env = loadEnv(".env");
        if (env.isEmpty()) {
            env = loadEnv("backend/.env");
        }

        String endpoint = env.getOrDefault("SUPABASE_S3_ENDPOINT", "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3");
        String region = env.getOrDefault("SUPABASE_S3_REGION", "ap-southeast-1");
        String accessKey = env.get("SUPABASE_S3_ACCESS_KEY");
        String secretKey = env.get("SUPABASE_S3_SECRET_KEY");
        String bucket = env.getOrDefault("SUPABASE_STORAGE_BUCKET", "SDMS");
        String publicBaseUrl = env.getOrDefault("SUPABASE_URL", "https://vshsmnrzeusimlcemzhc.supabase.co");

        org.junit.jupiter.api.Assumptions.assumeTrue(
                accessKey != null && !accessKey.trim().isEmpty() && secretKey != null && !secretKey.trim().isEmpty(),
                "Skipping live S3 test because SUPABASE_S3_ACCESS_KEY / SUPABASE_S3_SECRET_KEY are not present"
        );

        SupabaseStorageService storageService = new SupabaseStorageService(
                endpoint, region, accessKey, secretKey, bucket, publicBaseUrl
        );

        // Generate authentic JPEG image in-memory
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 200, 200);
        g.setColor(Color.WHITE);
        g.drawString("CollegeNexus Test", 30, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        byte[] jpegBytes = baos.toByteArray();

        MockMultipartFile mockFile = new MockMultipartFile(
                "image", "live_test_banner.jpg", "image/jpeg", jpegBytes
        );

        System.out.println("Executing LIVE S3 upload to bucket: " + bucket);
        String uploadedUrl = storageService.uploadImage(mockFile);

        System.out.println("Upload successful! Public URL: " + uploadedUrl);
        assertNotNull(uploadedUrl);
        assertTrue(uploadedUrl.contains("/storage/v1/object/public/" + bucket + "/events/"));
        assertTrue(uploadedUrl.endsWith(".jpg"));

        // Verify HTTP retrieval of the uploaded object
        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest getReq = HttpRequest.newBuilder()
                .uri(URI.create(uploadedUrl))
                .GET()
                .build();

        HttpResponse<byte[]> getRes = httpClient.send(getReq, HttpResponse.BodyHandlers.ofByteArray());
        System.out.println("Public URL HTTP status: " + getRes.statusCode());
        assertEquals(200, getRes.statusCode(), "Uploaded image must be publicly accessible with HTTP 200");
        assertTrue(getRes.body().length > 0, "Uploaded image content should not be empty");

        // Clean up test image
        storageService.deleteImage(uploadedUrl);
    }

    @Test
    @DisplayName("Verify complete S3 storage cleanup lifecycle: upload real image -> verify HTTP 200 -> delete -> verify object absent")
    void testLiveStorageDeleteLifecycle() throws Exception {
        Map<String, String> env = loadEnv(".env");
        if (env.isEmpty()) {
            env = loadEnv("backend/.env");
        }

        String endpoint = env.getOrDefault("SUPABASE_S3_ENDPOINT", "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3");
        String region = env.getOrDefault("SUPABASE_S3_REGION", "ap-southeast-1");
        String accessKey = env.get("SUPABASE_S3_ACCESS_KEY");
        String secretKey = env.get("SUPABASE_S3_SECRET_KEY");
        String bucket = env.getOrDefault("SUPABASE_STORAGE_BUCKET", "SDMS");
        String publicBaseUrl = env.getOrDefault("SUPABASE_URL", "https://vshsmnrzeusimlcemzhc.supabase.co");

        org.junit.jupiter.api.Assumptions.assumeTrue(
                accessKey != null && !accessKey.trim().isEmpty() && secretKey != null && !secretKey.trim().isEmpty(),
                "Skipping live S3 test because SUPABASE_S3_ACCESS_KEY / SUPABASE_S3_SECRET_KEY are not present"
        );

        SupabaseStorageService storageService = new SupabaseStorageService(
                endpoint, region, accessKey, secretKey, bucket, publicBaseUrl
        );

        // 1. Generate and upload authentic test JPEG
        BufferedImage img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.RED);
        g.fillRect(0, 0, 100, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        byte[] jpegBytes = baos.toByteArray();

        MockMultipartFile mockFile = new MockMultipartFile(
                "image", "TEST_PERFORMANCE_DELETE.jpg", "image/jpeg", jpegBytes
        );

        String uploadedUrl = storageService.uploadImage(mockFile);
        System.out.println("Uploaded test image for delete verification: " + uploadedUrl);
        assertNotNull(uploadedUrl);

        // 2. Verify image exists in S3 (HTTP 200)
        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest getReq = HttpRequest.newBuilder().uri(URI.create(uploadedUrl)).GET().build();
        HttpResponse<byte[]> getRes = httpClient.send(getReq, HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, getRes.statusCode(), "Uploaded image must exist prior to deletion");

        // 3. Delete image from S3 storage
        boolean deleted = storageService.deleteImage(uploadedUrl);
        assertTrue(deleted, "deleteImage should return true on successful S3 deletion");

        // 4. Verify image is absent from Supabase S3 storage via S3 API headObject
        String key = storageService.extractObjectKey(uploadedUrl);
        boolean existsInS3 = true;
        try {
            storageService.getS3Client().headObject(
                    software.amazon.awssdk.services.s3.model.HeadObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .build()
            );
        } catch (software.amazon.awssdk.services.s3.model.NoSuchKeyException e) {
            existsInS3 = false;
        } catch (software.amazon.awssdk.services.s3.model.S3Exception e) {
            if (e.statusCode() == 404) {
                existsInS3 = false;
            }
        }
        assertFalse(existsInS3, "Image must be absent from Supabase S3 storage after deletion");
        System.out.println("Verified: Image successfully deleted and absent from Supabase S3 storage bucket SDMS!");
    }
}
