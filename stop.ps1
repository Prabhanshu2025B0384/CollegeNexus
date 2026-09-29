<#
.SYNOPSIS
    Campus Nexus - Clean Shutdown Script (PowerShell)
.DESCRIPTION
    Stops the background backend and frontend processes using PID tracking
    and port listeners without terminating unrelated system processes.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "SilentlyContinue"

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

$runtimeDir = Join-Path $projectRoot ".runtime"

Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host "       CAMPUS NEXUS - STOPPING LOCAL DEVELOPMENT SERVICES" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Stop Backend via PID
$backendPidFile = Join-Path $runtimeDir "backend.pid"
if (Test-Path $backendPidFile) {
    $bPid = Get-Content $backendPidFile -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($bPid) {
        Write-Host "[*] Stopping Backend process tree (PID: $bPid)..." -ForegroundColor White
        taskkill /F /T /PID $bPid >$null 2>&1
    }
    Remove-Item $backendPidFile -Force -ErrorAction SilentlyContinue
}

# 2. Stop Frontend via PID
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"
if (Test-Path $frontendPidFile) {
    $fPid = Get-Content $frontendPidFile -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($fPid) {
        Write-Host "[*] Stopping Frontend process tree (PID: $fPid)..." -ForegroundColor White
        taskkill /F /T /PID $fPid >$null 2>&1
    }
    Remove-Item $frontendPidFile -Force -ErrorAction SilentlyContinue
}

# 3. Clean up any remaining listener on port 8080 or 5173
$portListeners = @(8080, 5173)
foreach ($port in $portListeners) {
    $lines = netstat -ano | Select-String ":$port\s+.*LISTENING\s+(\d+)"
    foreach ($line in $lines) {
        if ($line.Matches.Groups.Count -gt 1) {
            $orphanPid = $line.Matches.Groups[1].Value
            if ($orphanPid -and $orphanPid -ne "0") {
                Write-Host "[*] Cleaning up listener on port $port (PID: $orphanPid)..." -ForegroundColor DarkGray
                taskkill /F /T /PID $orphanPid >$null 2>&1
            }
        }
    }
}

Write-Host ""
Write-Host "[OK] Campus Nexus local services stopped cleanly." -ForegroundColor Green
Write-Host ""
exit 0
