<#
.SYNOPSIS
    Campus Nexus - One-Click Application Launcher (PowerShell)
.DESCRIPTION
    Validates configuration, checks prerequisites, starts Spring Boot backend and
    React/Vite frontend in the background with logging, verifies health/readiness,
    and opens the default browser before exiting cleanly.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# Determine script directory (project root)
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$logsDir = Join-Path $projectRoot "logs"
$runtimeDir = Join-Path $projectRoot ".runtime"

# Ensure logs and runtime directories exist
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}
if (-not (Test-Path $runtimeDir)) {
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       CAMPUS NEXUS - COLLEGE CLUB EVENT MANAGEMENT PLATFORM" -ForegroundColor Cyan
Write-Host "                     One-Click Development Launcher" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to test port readiness reliably across IPv4, IPv6, and netstat
function Test-ServerReady([int]$port) {
    $targets = @("127.0.0.1", "localhost", "::1")
    foreach ($target in $targets) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $iar = $tcp.BeginConnect($target, $port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(600, $false) -and $tcp.Connected) {
                $tcp.EndConnect($iar)
                $tcp.Close()
                return $true
            }
            $tcp.Close()
        } catch {
            # continue
        }
    }

    $stat = netstat -ano | Select-String ":$port\s+.*LISTENING"
    if ($stat) {
        return $true
    }

    return $false
}

# -----------------------------------------------------------------------------
# 1. ENVIRONMENT CONFIGURATION VALIDATION
# -----------------------------------------------------------------------------
Write-Host "[1/6] Validating environment configuration..." -ForegroundColor White

$backendEnv = Join-Path $backendDir ".env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "backend/.env was not found." -ForegroundColor Red
    Write-Host "Create backend/.env using backend/.env.example and add your Supabase configuration." -ForegroundColor Yellow
    exit 1
}

# Verify required Database, S3 Storage, and Security variables exist in backend/.env without exposing values
$requiredKeys = @("DATABASE_URL", "JWT_SECRET", "SUPABASE_STORAGE_BUCKET", "SUPABASE_S3_ACCESS_KEY", "SUPABASE_S3_SECRET_KEY")
$envContent = Get-Content $backendEnv -Encoding UTF8
$foundKeys = @{}

foreach ($line in $envContent) {
    $trimmed = $line.Trim()
    if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
        $parts = $trimmed.Split("=", 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim().Trim('"', "'")
        $foundKeys[$key] = $val
        # Export each variable to current process environment so child processes inherit it
        [Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

# Set default S3 endpoint and region if not explicitly provided
if (-not $foundKeys.ContainsKey("SUPABASE_S3_ENDPOINT") -or [string]::IsNullOrWhiteSpace($foundKeys["SUPABASE_S3_ENDPOINT"])) {
    [Environment]::SetEnvironmentVariable("SUPABASE_S3_ENDPOINT", "https://vshsmnrzeusimlcemzhc.storage.supabase.co/storage/v1/s3", "Process")
}
if (-not $foundKeys.ContainsKey("SUPABASE_S3_REGION") -or [string]::IsNullOrWhiteSpace($foundKeys["SUPABASE_S3_REGION"])) {
    [Environment]::SetEnvironmentVariable("SUPABASE_S3_REGION", "ap-southeast-1", "Process")
}

$missingKeys = @()
foreach ($req in $requiredKeys) {
    if (-not $foundKeys.ContainsKey($req) -or [string]::IsNullOrWhiteSpace($foundKeys[$req])) {
        $missingKeys += $req
    }
}

if ($missingKeys.Count -gt 0) {
    Write-Host "Error: The following required environment variable(s) are missing in backend/.env:" -ForegroundColor Red
    foreach ($m in $missingKeys) {
        Write-Host "  - $m" -ForegroundColor Red
    }
    Write-Host "Please update backend/.env with your Supabase configuration." -ForegroundColor Yellow
    exit 1
}

# Ensure frontend/.env exists
$frontendEnv = Join-Path $frontendDir ".env"
if (-not (Test-Path $frontendEnv)) {
    "VITE_API_URL=http://localhost:8080/api" | Out-File -FilePath $frontendEnv -Encoding UTF8
    Write-Host "  - Created frontend/.env with default API URL" -ForegroundColor DarkGray
}

# Check database connectivity and network constraints
$dbUrlLine = $envContent | Where-Object { $_.Trim() -match "^DATABASE_URL\s*=" } | Select-Object -First 1
if ($dbUrlLine) {
    $rawDbUrl = ($dbUrlLine -split "=", 2)[1].Trim().Trim('"', "'")
    if ($rawDbUrl -match "@([^:/]+)(?::(\d+))?") {
        $dbHost = $matches[1]
        $dbPort = if ($matches[2]) { [int]$matches[2] } else { 5432 }
        if ($dbHost -ne "localhost" -and $dbHost -ne "127.0.0.1") {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $iar = $tcp.BeginConnect($dbHost, $dbPort, $null, $null)
                $remoteReachable = $iar.AsyncWaitHandle.WaitOne(2000, $false) -and $tcp.Connected
                $tcp.Close()
                if (-not $remoteReachable) {
                    $localTcp = New-Object System.Net.Sockets.TcpClient
                    $localIar = $localTcp.BeginConnect("127.0.0.1", 5432, $null, $null)
                    $localReachable = $localIar.AsyncWaitHandle.WaitOne(1000, $false) -and $localTcp.Connected
                    $localTcp.Close()
                    if ($localReachable) {
                        Write-Host "  [!] Notice: Remote database '$($dbHost):$($dbPort)' is unreachable on this network (firewall filter)." -ForegroundColor Yellow
                        Write-Host "      Seamlessly routing database traffic to active local PostgreSQL on localhost:5432." -ForegroundColor Cyan
                        [System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://postgres:root@localhost:5432/postgres", "Process")
                    }
                }
            } catch {}
        }
    }
}

Write-Host "  [OK] Environment configuration verified." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. PREREQUISITE CHECKS (Java 21 & Node.js/npm)
# -----------------------------------------------------------------------------
Write-Host "[2/6] Checking system prerequisites..." -ForegroundColor White

$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "Java is required to start the Spring Boot backend." -ForegroundColor Red
    Write-Host "Please install Java (JDK 21 or later) from: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "Node.js/npm is required to start the frontend." -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "  [OK] Java and Node.js detected." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. FRONTEND DEPENDENCIES CHECK
# -----------------------------------------------------------------------------
Write-Host "[3/6] Checking frontend dependencies..." -ForegroundColor White

$nodeModules = Join-Path $frontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "  - node_modules not found. Installing dependencies (one-time setup)..." -ForegroundColor Yellow
    $installProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory $frontendDir -NoNewWindow -Wait -PassThru
    if ($installProc.ExitCode -ne 0) {
        Write-Host "Failed to install frontend dependencies." -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "  [OK] Dependencies already installed." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. START SPRING BOOT BACKEND (Hidden Background Process)
# -----------------------------------------------------------------------------
Write-Host "[4/6] Starting Spring Boot backend in background..." -ForegroundColor White

$backendLog = Join-Path $logsDir "backend.log"
$mvnwCmd = Join-Path $backendDir "mvnw.cmd"

# Clean up any previous backend process or port 8080 listener
$backendPidFile = Join-Path $runtimeDir "backend.pid"
if (Test-Path $backendPidFile) {
    $oldPid = Get-Content $backendPidFile -ErrorAction SilentlyContinue
    if ($oldPid) {
        cmd.exe /c "taskkill /F /T /PID $oldPid >nul 2>nul"
    }
    Remove-Item $backendPidFile -Force -ErrorAction SilentlyContinue
}
$portPids = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pp in $portPids) {
    if ($pp -and $pp -ne 0) { cmd.exe /c "taskkill /F /T /PID $pp >nul 2>nul" }
}

# Launch Spring Boot with redirected logs and hidden window
$jarPath = Join-Path $backendDir "target\app.jar"
if (Test-Path $jarPath) {
    $backendStartCmd = "/c `"java -jar `"$jarPath`" > `"$backendLog`" 2>&1`""
} else {
    $backendStartCmd = "/c `"`"$mvnwCmd`" spring-boot:run > `"$backendLog`" 2>&1`""
}
$backendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList $backendStartCmd `
    -WorkingDirectory $backendDir `
    -WindowStyle Hidden `
    -PassThru

# Save process ID
$backendProcess.Id | Out-File -FilePath $backendPidFile -Encoding UTF8

Write-Host "  - Waiting for backend to become ready on port 8080..." -NoNewline

$backendReady = $false
$maxBackendWait = 120
$sw = [System.Diagnostics.Stopwatch]::StartNew()

while ($sw.Elapsed.TotalSeconds -lt $maxBackendWait) {
    if ($backendProcess.HasExited) {
        Write-Host ""
        Write-Host "Backend failed to start. Process exited prematurely (ExitCode: $($backendProcess.ExitCode))." -ForegroundColor Red
        Write-Host "Check: logs/backend.log" -ForegroundColor Yellow
        exit 1
    }

    if (Test-ServerReady 8080) {
        $backendReady = $true
        break
    }

    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "Backend failed to start within $maxBackendWait seconds." -ForegroundColor Red
    Write-Host "Check: logs/backend.log" -ForegroundColor Yellow
    exit 1
}

Write-Host " Ready!" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 5. START REACT / VITE FRONTEND (Hidden Background Process)
# -----------------------------------------------------------------------------
Write-Host "[5/6] Starting React/Vite frontend in background..." -ForegroundColor White

$frontendLog = Join-Path $logsDir "frontend.log"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"

# Clean up any previous frontend process or port 5173 listener
if (Test-Path $frontendPidFile) {
    $oldPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue
    if ($oldPid) {
        cmd.exe /c "taskkill /F /T /PID $oldPid >nul 2>nul"
    }
    Remove-Item $frontendPidFile -Force -ErrorAction SilentlyContinue
}
$frontPids = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($fp in $frontPids) {
    if ($fp -and $fp -ne 0) { cmd.exe /c "taskkill /F /T /PID $fp >nul 2>nul" }
}

$frontendStartCmd = "/c `"npm run dev > `"$frontendLog`" 2>&1`""
$frontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList $frontendStartCmd `
    -WorkingDirectory $frontendDir `
    -WindowStyle Hidden `
    -PassThru

# Save frontend process ID
$frontendProcess.Id | Out-File -FilePath $frontendPidFile -Encoding UTF8

Write-Host "  - Waiting for frontend to become ready on port 5173..." -NoNewline

$frontendReady = $false
$maxFrontendWait = 45
$sw = [System.Diagnostics.Stopwatch]::StartNew()

while ($sw.Elapsed.TotalSeconds -lt $maxFrontendWait) {
    if ($frontendProcess.HasExited) {
        Write-Host ""
        Write-Host "Frontend failed to start. Process exited prematurely (ExitCode: $($frontendProcess.ExitCode))." -ForegroundColor Red
        Write-Host "Check: logs/frontend.log" -ForegroundColor Yellow
        exit 1
    }

    if (Test-ServerReady 5173) {
        $frontendReady = $true
        break
    }

    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
}

if (-not $frontendReady) {
    Write-Host ""
    Write-Host "Frontend failed to start within $maxFrontendWait seconds." -ForegroundColor Red
    Write-Host "Check: logs/frontend.log" -ForegroundColor Yellow
    exit 1
}

Write-Host " Ready!" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 6. OPEN DEFAULT BROWSER & FINISH
# -----------------------------------------------------------------------------
Write-Host "[6/6] Launching default browser to http://localhost:5173..." -ForegroundColor White
try { Start-Process "http://localhost:5173" -ErrorAction SilentlyContinue } catch {}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  CAMPUS NEXUS APPLICATION IS RUNNING IN THE BACKGROUND!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  - Student Portal:   http://localhost:5173" -ForegroundColor White
Write-Host "  - Admin Dashboard:  http://localhost:5173/admin/dashboard" -ForegroundColor White
Write-Host "  - Backend REST API: http://localhost:8080/api" -ForegroundColor White
Write-Host "  - Logs:             logs/backend.log and logs/frontend.log" -ForegroundColor DarkGray
Write-Host "  - To Stop Servers:  run .\stop.ps1" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

exit 0
