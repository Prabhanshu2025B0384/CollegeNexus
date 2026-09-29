package com.college.club.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SupabaseStorageServiceTest {

    private SupabaseStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new SupabaseStorageService();
    }

    @Test
    @DisplayName("Should detect when Supabase S3 storage is not configured")
    void testIsConfiguredFalseWhenMissing() {
        assertFalse(storageService.isConfigured());

        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "");
        assertFalse(storageService.isConfigured());
    }

    @Test
    @DisplayName("Should detect when Supabase S3 storage is properly configured")
    void testIsConfiguredTrueWhenSet() {
        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3Region", "ap-southeast-1");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "test-access-key");
        ReflectionTestUtils.setField(storageService, "s3SecretKey", "test-secret-key");
        assertTrue(storageService.isConfigured());
    }

    @Test
    @DisplayName("Should reject upload when storage service is not configured")
    void testUploadWhenNotConfigured() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0 });
        assertThrows(IllegalStateException.class, () -> storageService.uploadImage(file));
    }

    @Test
    @DisplayName("Should reject empty or null files")
    void testUploadEmptyFile() {
        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "test-access-key");
        ReflectionTestUtils.setField(storageService, "s3SecretKey", "test-secret-key");

        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(emptyFile));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(null));
    }

    @Test
    @DisplayName("Should reject oversized files (> 5MB)")
    void testUploadOversizedFile() {
        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "test-access-key");
        ReflectionTestUtils.setField(storageService, "s3SecretKey", "test-secret-key");

        // 5MB + 1 byte
        byte[] oversizedBytes = new byte[(int) (5 * 1024 * 1024 + 1)];
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.png", "image/png", oversizedBytes);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(largeFile));
        assertTrue(ex.getMessage().contains("exceeds maximum allowed limit"));
    }

    @Test
    @DisplayName("Should reject SVG / HTML / scripts spoofed as image files")
    void testRejectSpoofedImageFiles() {
        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "test-access-key");
        ReflectionTestUtils.setField(storageService, "s3SecretKey", "test-secret-key");

        // SVG disguised as PNG
        String svgContent = "<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>";
        MockMultipartFile svgFile = new MockMultipartFile("file", "badge.png", "image/png", svgContent.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(svgFile));

        // HTML disguised as JPG
        String htmlContent = "<!DOCTYPE html><html><body><h1>Fake Image</h1></body></html>";
        MockMultipartFile htmlFile = new MockMultipartFile("file", "banner.jpg", "image/jpeg", htmlContent.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(htmlFile));

        // Windows executable / binary header
        byte[] exeBytes = new byte[]{ 0x4D, 0x5A, (byte)0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
        MockMultipartFile exeFile = new MockMultipartFile("file", "virus.jpg", "image/jpeg", exeBytes);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(exeFile));
    }

    @Test
    @DisplayName("Should reject files smaller than 12 bytes")
    void testRejectTooSmallFiles() {
        ReflectionTestUtils.setField(storageService, "s3Endpoint", "https://xyz.storage.supabase.co/storage/v1/s3");
        ReflectionTestUtils.setField(storageService, "s3AccessKey", "test-access-key");
        ReflectionTestUtils.setField(storageService, "s3SecretKey", "test-secret-key");

        byte[] smallBytes = new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF }; // Only 3 bytes
        MockMultipartFile file = new MockMultipartFile("file", "tiny.jpg", "image/jpeg", smallBytes);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(file));
    }

    @Test
    @DisplayName("Parameterized constructor initializes all fields and isConfigured is true")
    void testParameterizedConstructor() {
        SupabaseStorageService customService = new SupabaseStorageService("https://project.supabase.co", "test-key", "test-bucket");
        assertTrue(customService.isConfigured());
    }

    @Test
    @DisplayName("Should detect and allow valid JPEG magic bytes and successfully upload via S3Client mock")
    void testValidJpegDetectionAndUpload() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );
        S3Client mockS3Client = mock(S3Client.class);
        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        storageService.setS3Client(mockS3Client);

        // Valid JPEG header: FF D8 FF E0 00 10 4A 46 49 46 00 01
        byte[] jpegBytes = new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpegBytes);

        String url = storageService.uploadImage(file);
        assertNotNull(url);
        assertTrue(url.startsWith("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/"));
        assertTrue(url.endsWith(".jpg"));
        verify(mockS3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("Should detect and allow valid PNG magic bytes and successfully upload via S3Client mock")
    void testValidPngDetectionAndUpload() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );
        S3Client mockS3Client = mock(S3Client.class);
        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        storageService.setS3Client(mockS3Client);

        // Valid PNG header: 89 50 4E 47 0D 0A 1A 0A 00 00 00 0D
        byte[] pngBytes = new byte[]{ (byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", pngBytes);

        String url = storageService.uploadImage(file);
        assertNotNull(url);
        assertTrue(url.startsWith("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/"));
        assertTrue(url.endsWith(".png"));
    }

    @Test
    @DisplayName("Should detect and allow valid WebP magic bytes and successfully upload via S3Client mock")
    void testValidWebpDetectionAndUpload() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );
        S3Client mockS3Client = mock(S3Client.class);
        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        storageService.setS3Client(mockS3Client);

        // Valid WebP header: 'RIFF' + 4 bytes size + 'WEBP'
        byte[] webpBytes = new byte[]{ 'R', 'I', 'F', 'F', 0x20, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P' };
        MockMultipartFile file = new MockMultipartFile("file", "photo.webp", "image/webp", webpBytes);

        String url = storageService.uploadImage(file);
        assertNotNull(url);
        assertTrue(url.startsWith("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/"));
        assertTrue(url.endsWith(".webp"));
    }

    @Test
    @DisplayName("Should extract object key correctly from public URL and return null for external URLs")
    void testExtractObjectKey() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );

        String fullUrl = "https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/123e4567-e89b-12d3-a456-426614174000.jpg";
        assertEquals("events/123e4567-e89b-12d3-a456-426614174000.jpg", storageService.extractObjectKey(fullUrl));

        String rawKey = "events/custom-file.png";
        assertEquals("events/custom-file.png", storageService.extractObjectKey(rawKey));

        String externalUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format";
        assertNull(storageService.extractObjectKey(externalUrl));
    }

    @Test
    @DisplayName("Should safely delete S3 image when valid Supabase URL is passed")
    void testDeleteImageSuccess() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );
        S3Client mockS3Client = mock(S3Client.class);
        storageService.setS3Client(mockS3Client);

        String publicUrl = "https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/test-uuid.jpg";
        boolean result = storageService.deleteImage(publicUrl);

        assertTrue(result);
        verify(mockS3Client, times(1)).deleteObject(any(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.class));
    }

    @Test
    @DisplayName("Should skip delete and return true when non-Supabase external URL is passed")
    void testDeleteImageSkipsExternal() {
        storageService = new SupabaseStorageService(
                "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3",
                "ap-southeast-1",
                "mock-access-key",
                "mock-secret-key",
                "SDMS",
                "https://vshsmnrzeusimlcemzhc.supabase.co"
        );
        S3Client mockS3Client = mock(S3Client.class);
        storageService.setS3Client(mockS3Client);

        String unsplashUrl = "https://images.unsplash.com/photo-1540575467063";
        boolean result = storageService.deleteImage(unsplashUrl);

        assertTrue(result);
        verify(mockS3Client, never()).deleteObject(any(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.class));
    }
}
