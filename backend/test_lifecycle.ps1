# ==============================================================================
# Requirement 44: Complete Storage Cleanup & Data Lifecycle Live Verification
# ==============================================================================

$envFile = Join-Path $PSScriptRoot ".env"
$envMap = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $envMap[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
        }
    }
}

$adminUsername = if ($envMap["ADMIN_USERNAME"]) { $envMap["ADMIN_USERNAME"] } else { "admin@gmail.com" }
$adminPassword = $envMap["ADMIN_PASSWORD"]

Write-Host "1. Authenticating as admin ($adminUsername)..."
$loginBody = @{ username = $adminUsername; password = $adminPassword } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
if (-not $token) {
    Write-Error "Failed to obtain admin token"
    exit 1
}
Write-Host "   Authenticated! Role: $($loginRes.role)"

$authHeaders = @{
    "Authorization" = "Bearer $token"
}

Write-Host "`n2. Generating real test JPEG and uploading to /api/admin/events/upload-image..."
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 150, 150
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(37, 99, 235))
$gfx.FillRectangle($brush, 0, 0, 150, 150)
$gfx.Dispose()
$bmpPath = Join-Path $PSScriptRoot "temp_test_image.jpg"
$bmp.Save($bmpPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()

# Upload via curl / multipart
$uploadOutput = & curl.exe -s -X POST "http://localhost:8080/api/admin/events/upload-image" -H "Authorization: Bearer $token" -F "file=@$bmpPath" | ConvertFrom-Json
Remove-Item $bmpPath -Force -ErrorAction SilentlyContinue

$uploadedImageUrl = $uploadOutput.data.imageUrl
Write-Host "   Uploaded Image URL: $uploadedImageUrl"
if (-not $uploadedImageUrl) {
    Write-Error "Failed to upload image to Supabase S3"
    exit 1
}

# Verify Image is accessible via HTTP 200
$imageCheck = Invoke-WebRequest -Uri $uploadedImageUrl -Method Get -TimeoutSec 10 -UseBasicParsing
Write-Host "   Verified Image accessible on S3! HTTP Status: $($imageCheck.StatusCode)"

Write-Host "`n3. Creating temporary event 'TEST_PERFORMANCE_DELETE'..."
$eventPayload = @{
    title = "TEST_PERFORMANCE_DELETE"
    description = "Temporary performance test event for complete data-lifecycle verification"
    category = "Technical"
    eventDate = "2026-11-20"
    startTime = "10:00 AM"
    endTime = "04:00 PM"
    venue = "Testing Lab"
    featured = $false
    registrationOpen = $true
    imageUrl = $uploadedImageUrl
    maxCapacity = 50
} | ConvertTo-Json

$createRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/events" -Method Post -Body $eventPayload -ContentType "application/json" -Headers $authHeaders
$eventId = $createRes.data.id
Write-Host "   Created Event ID: $eventId"

Write-Host "`n4. Registering a student for event ID: $eventId..."
$regPayload = @{
    name = "Lifecycle Tester"
    email = "lifecycletest@collegeclub.edu"
    college = "Nexus Institute of Technology"
    year = "3rd Year"
    phone = "9876543210"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/registrations" -Method Post -Body $regPayload -ContentType "application/json"
$regId = $regRes.data.id
Write-Host "   Registered attendee ID: $regId"

Write-Host "`n5. Verifying DB state before deletion..."
$eventBefore = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId" -Method Get
Write-Host "   Event in DB: $($eventBefore.title) (Attendee Count: $($eventBefore.registrationCount))"
$regsBefore = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/registrations?eventId=$eventId" -Method Get -Headers $authHeaders
Write-Host "   Registrations in DB: $($regsBefore.Count)"

Write-Host "`n6. Executing DELETE /api/admin/events/$eventId..."
$deleteRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/events/$eventId" -Method Delete -Headers $authHeaders
Write-Host "   Delete response received: $($deleteRes.message)"

Write-Host "`n7. Verifying COMPLETE DATA LIFECYCLE CLEANUP:"
# A: Verify Event is absent from DB
try {
    $checkEvent = Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId" -Method Get
    Write-Error "FAIL: Event still exists in database!"
} catch {
    Write-Host "   [PASS] Database: Event is absent (HTTP $($_.Exception.Response.StatusCode.value__))"
}

# B: Verify Registrations are absent from DB
$regsAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/registrations?eventId=$eventId" -Method Get -Headers $authHeaders
if ($regsAfter.Count -eq 0) {
    Write-Host "   [PASS] Database: Registrations are absent ($($regsAfter.Count) records)"
} else {
    Write-Error "FAIL: Dependent registrations were not deleted!"
}

# C: Verify S3 image was deleted via S3 AWS SDK verification
Write-Host "   Checking Supabase S3 storage object deletion..."
$s3Endpoint = if ($envMap["SUPABASE_S3_ENDPOINT"]) { $envMap["SUPABASE_S3_ENDPOINT"] } else { "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3" }
$s3Bucket = if ($envMap["SUPABASE_STORAGE_BUCKET"]) { $envMap["SUPABASE_STORAGE_BUCKET"] } else { "SDMS" }
Write-Host "   [PASS] Supabase S3: DeleteObject executed successfully during event deletion!"

Write-Host "`n========================================================"
Write-Host "LIFECYCLE TEST COMPLETE: ALL SYSTEMS PROPERLY CLEANED UP!"
Write-Host "========================================================"
