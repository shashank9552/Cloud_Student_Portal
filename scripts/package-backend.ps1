# scripts/package-backend.ps1
# Production packaging script for CloudEdu Lambda Backend (Node.js 24.x ESM)
[CmdletBinding()]
param (
    [string]$OutputPath = "",
    [switch]$SkipNpmInstall = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CloudEdu Lambda Backend Packaging (Node.js 24.x ESM)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Robust path resolution
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

$ProjectRoot = (Resolve-Path "$ScriptDir\..").Path
$BackendDir = Join-Path $ProjectRoot "backend"
$StagingDir = Join-Path $ProjectRoot "build_staging_lambda"

if (-not $OutputPath) {
    $OutputPath = Join-Path $ProjectRoot "backend.zip"
} else {
    $OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
}

if (-not (Test-Path $BackendDir)) {
    Write-Error "Backend directory not found at $BackendDir"
    exit 1
}

# 1. Clean previous builds
if (Test-Path $OutputPath) {
    Write-Host "[1/5] Removing existing archive at $OutputPath..." -ForegroundColor Yellow
    Remove-Item $OutputPath -Force
}
if (Test-Path $StagingDir) {
    Remove-Item $StagingDir -Recurse -Force
}

# 2. Production npm install
if (-not $SkipNpmInstall) {
    Write-Host "[2/5] Installing production dependencies in $BackendDir..." -ForegroundColor Green
    Push-Location $BackendDir
    try {
        & npm install --omit=dev --no-audit --prefer-offline
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm install failed with exit code $LASTEXITCODE"
            exit 1
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[2/5] Skipping npm install as requested." -ForegroundColor Yellow
}

# 3. Create Staging Directory with correct hierarchy
Write-Host "[3/5] Assembling package hierarchy in staging directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

# Copy src preserving folder structure
Copy-Item -Path (Join-Path $BackendDir "src") -Destination (Join-Path $StagingDir "src") -Recurse -Force

# Copy package.json
Copy-Item -Path (Join-Path $BackendDir "package.json") -Destination (Join-Path $StagingDir "package.json") -Force

# Copy node_modules
if (Test-Path (Join-Path $BackendDir "node_modules")) {
    Copy-Item -Path (Join-Path $BackendDir "node_modules") -Destination (Join-Path $StagingDir "node_modules") -Recurse -Force
} else {
    Write-Warning "node_modules directory not found in $BackendDir."
}

# 4. Generate backend.zip using .NET System.IO.Compression (fast & headless safe)
Write-Host "[4/5] Compressing staging directory into $OutputPath..." -ForegroundColor Green
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($StagingDir, $OutputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Clean up staging
Remove-Item $StagingDir -Recurse -Force

# 5. Verification & ZIP Inspection
Write-Host "[5/5] Verifying ZIP structure and handler..." -ForegroundColor Green

$zip = [System.IO.Compression.ZipFile]::OpenRead($OutputPath)

$entries = $zip.Entries | Select-Object -ExpandProperty FullName

$hasApiRouter = ($entries -contains "src/apiRouter.js") -or ($entries -contains "src\apiRouter.js")
$hasHandlerRouter = ($entries -contains "src/handlers/apiRouter.js") -or ($entries -contains "src\handlers\apiRouter.js")
$hasPackageJson = ($entries -contains "package.json")
$hasNodeModules = ($entries | Where-Object { $_ -like "node_modules/*" -or $_ -like "node_modules\*" }).Count -gt 0

$zipSizeMB = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
$totalEntries = $zip.Entries.Count

$zip.Dispose()

Write-Host "`nArchive Verification Results:" -ForegroundColor Cyan
Write-Host " - Archive Path:        $OutputPath ($zipSizeMB MB)"
Write-Host " - Total Files/Entries: $totalEntries"
Write-Host " - Handler file (src/apiRouter.js):         " -NoNewline
if ($hasApiRouter) { Write-Host "FOUND [OK]" -ForegroundColor Green } else { Write-Host "MISSING [FAIL]" -ForegroundColor Red }

Write-Host " - Handler file (src/handlers/apiRouter.js):" -NoNewline
if ($hasHandlerRouter) { Write-Host "FOUND [OK]" -ForegroundColor Green } else { Write-Host "MISSING [FAIL]" -ForegroundColor Red }

Write-Host " - Package Manifest (package.json):         " -NoNewline
if ($hasPackageJson) { Write-Host "FOUND [OK]" -ForegroundColor Green } else { Write-Host "MISSING [FAIL]" -ForegroundColor Red }

Write-Host " - Runtime Dependencies (node_modules):     " -NoNewline
if ($hasNodeModules) { Write-Host "FOUND [OK]" -ForegroundColor Green } else { Write-Host "MISSING [FAIL]" -ForegroundColor Red }

if (-not ($hasApiRouter -and $hasPackageJson)) {
    Write-Error "CRITICAL: The generated ZIP is missing required runtime files for AWS Lambda!"
    exit 1
}

Write-Host "`nSUCCESS: backend.zip is verified and ready for AWS Lambda (Node.js 24.x) deployment!" -ForegroundColor Green
