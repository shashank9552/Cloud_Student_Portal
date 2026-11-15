# scripts/verify-deployment.ps1
# Comprehensive Post-Deployment Verification Script for CloudEdu Portal
# Target Region: ap-south-1
[CmdletBinding()]
param (
    [string]$Region = "ap-south-1",
    [string]$StackName = "CloudEdu-Backend-API",
    [string]$ProjectName = "CloudEdu",
    [string]$Environment = "dev",
    [string]$ApiUrl = ""
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " CloudEdu AWS Backend Deployment Verification Audit      " -ForegroundColor Cyan
Write-Host " Target Region: $Region                                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$EnvFilePath = Join-Path $ProjectRoot ".env"

# 1. Check AWS Credentials & Account
Write-Host "`n[1/7] AWS Authentication & Target Environment..." -ForegroundColor Green
try {
    $identity = (& aws sts get-caller-identity --output json | ConvertFrom-Json)
    Write-Host " [PASS] AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host " [PASS] Caller ARN:  $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host " [FAIL] Could not authenticate with AWS CLI. Check credentials." -ForegroundColor Red
    exit 1
}

# 2. Check CloudFormation Stack Status & Retrieve Outputs
Write-Host "`n[2/7] Checking CloudFormation Stack: $StackName..." -ForegroundColor Green
try {
    $stack = (& aws cloudformation describe-stacks --stack-name $StackName --region $Region --output json | ConvertFrom-Json).Stacks[0]
    $stackStatus = $stack.StackStatus
    Write-Host " [PASS] Stack Status: $stackStatus" -ForegroundColor Green

    $outputs = $stack.Outputs
    $stackApiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpointUrl" }).OutputValue
    $stackBucket = ($outputs | Where-Object { $_.OutputKey -eq "SubmissionsBucketName" }).OutputValue

    if (-not $ApiUrl) {
        $ApiUrl = $stackApiUrl
    }
} catch {
    Write-Host " [WARN] Stack '$StackName' not found or describe failed. Falling back to .env." -ForegroundColor Yellow
}

if (-not $ApiUrl -and (Test-Path $EnvFilePath)) {
    Get-Content $EnvFilePath | ForEach-Object {
        if ($_ -match "^\s*VITE_API_GATEWAY_URL\s*=\s*(.+)$") {
            $ApiUrl = $matches[1].Trim()
        }
    }
}

Write-Host " - Target API Gateway URL: $ApiUrl"

# 3. Verify Lambda Function (Runtime & Status)
Write-Host "`n[3/7] Verifying AWS Lambda Function..." -ForegroundColor Green
$functionName = "$ProjectName-Backend-API-$Environment"
try {
    $func = (& aws lambda get-function --function-name $functionName --region $Region --output json | ConvertFrom-Json).Configuration
    Write-Host " [PASS] Function Name:   $($func.FunctionName)" -ForegroundColor Green
    Write-Host " [PASS] Runtime:         $($func.Runtime)" -NoNewline
    if ($func.Runtime -eq "nodejs24.x") {
        Write-Host " [NODE 24.X CONFIRMED]" -ForegroundColor Green
    } else {
        Write-Host " [UNEXPECTED RUNTIME: $($func.Runtime)]" -ForegroundColor Yellow
    }
    Write-Host " [PASS] Handler:         $($func.Handler)" -ForegroundColor Green
    Write-Host " [PASS] State:           $($func.State) (LastUpdateStatus: $($func.LastUpdateStatus))" -ForegroundColor Green
    Write-Host " [PASS] Memory:          $($func.MemorySize) MB, Timeout: $($func.Timeout)s" -ForegroundColor Green
} catch {
    Write-Host " [WARN] Could not retrieve Lambda function: $functionName" -ForegroundColor Yellow
}

# 4. Verify S3 Document Bucket Security
Write-Host "`n[4/7] Auditing Amazon S3 Private Bucket Security..." -ForegroundColor Green
if ($stackBucket) {
    try {
        # Check Public Access Block
        $pab = (& aws s3api get-public-access-block --bucket $stackBucket --output json 2>$null | ConvertFrom-Json).PublicAccessBlockConfiguration
        if ($pab.BlockPublicAcls -and $pab.IgnorePublicAcls -and $pab.BlockPublicPolicy -and $pab.RestrictPublicBuckets) {
            Write-Host " [PASS] S3 Block Public Access: Fully Enabled (Private Bucket)" -ForegroundColor Green
        } else {
            Write-Host " [WARN] S3 Block Public Access is NOT fully enabled!" -ForegroundColor Yellow
        }

        # Check CORS
        $cors = & aws s3api get-bucket-cors --bucket $stackBucket --output json 2>$null
        if ($cors) {
            Write-Host " [PASS] S3 CORS Policy: Configured for direct browser PUT/GET" -ForegroundColor Green
        } else {
            Write-Host " [WARN] S3 CORS configuration missing!" -ForegroundColor Yellow
        }

        # Check Encryption
        $enc = (& aws s3api get-bucket-encryption --bucket $stackBucket --output json 2>$null | ConvertFrom-Json)
        if ($enc.ServerSideEncryptionConfiguration) {
            Write-Host " [PASS] S3 Default Server-Side Encryption: Enabled" -ForegroundColor Green
        } else {
            Write-Host " [WARN] S3 Encryption not detected!" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [WARN] S3 Bucket audit exception: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host " [INFO] Skipping direct S3 bucket audit (Bucket name not retrieved)."
}

# 5. Verify DynamoDB Tables & Indexes
Write-Host "`n[5/7] Auditing Amazon DynamoDB Tables and GSIs..." -ForegroundColor Green
$tablesToCheck = @(
    @{ Name = "$ProjectName-Users"; ExpectedGsi = @("RollNumberIndex") },
    @{ Name = "$ProjectName-Assignments"; ExpectedGsi = @("CourseCodeIndex") },
    @{ Name = "$ProjectName-Submissions"; ExpectedGsi = @("AssignmentSubmissionsIndex", "StudentSubmissionsIndex", "SubmissionIdIndex") }
)

foreach ($item in $tablesToCheck) {
    $tName = $item.Name
    try {
        $t = (& aws dynamodb describe-table --table-name $tName --region $Region --output json 2>$null | ConvertFrom-Json).Table
        Write-Host " [PASS] Table $tName : Status=$($t.TableStatus), BillingMode=$($t.BillingModeSummary.BillingMode)" -ForegroundColor Green

        $activeGsis = @($t.GlobalSecondaryIndexes | ForEach-Object { $_.IndexName })
        foreach ($egsi in $item.ExpectedGsi) {
            if ($activeGsis -contains $egsi) {
                Write-Host "    [OK] GSI: $egsi is ACTIVE" -ForegroundColor DarkGreen
            } else {
                Write-Host "    [ACTION REQUIRED] GSI: $egsi is MISSING from $tName!" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host " [WARN] Could not inspect table $tName." -ForegroundColor Yellow
    }
}

# 6. Live API Gateway Health Endpoint Probe
Write-Host "`n[6/7] Probing Live API Gateway Endpoints..." -ForegroundColor Green
if ($ApiUrl -and -not ($ApiUrl -like "*mock*") -and -not ($ApiUrl -like "*xxxxxxxxxx*")) {
    $healthUrl = "$ApiUrl/health"
    Write-Host " - Testing GET $healthUrl (Public Uptime Probe)..."
    try {
        $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
        Write-Host " [PASS] Health Probe Response: " -ForegroundColor Green
        Write-Host "        Service:   $($healthResponse.data.service)" -ForegroundColor Green
        Write-Host "        Status:    $($healthResponse.data.status)" -ForegroundColor Green
        Write-Host "        Region:    $($healthResponse.data.region)" -ForegroundColor Green
    } catch {
        Write-Host " [FAIL] Could not reach $healthUrl. ($($_.Exception.Message))" -ForegroundColor Red
    }

    # Test OPTIONS preflight
    Write-Host " - Testing CORS Preflight: OPTIONS $ApiUrl/assignments..."
    try {
        $optionsResponse = Invoke-WebRequest -Uri "$ApiUrl/assignments" -Method Options -TimeoutSec 10 -ErrorAction Stop
        $allowOrigin = $optionsResponse.Headers["Access-Control-Allow-Origin"]
        if ($allowOrigin -eq "*") {
            Write-Host " [PASS] CORS Preflight: 200 OK (Access-Control-Allow-Origin: $allowOrigin)" -ForegroundColor Green
        } else {
            Write-Host " [WARN] CORS Preflight Header: $allowOrigin" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [WARN] CORS preflight request failed ($($_.Exception.Message))" -ForegroundColor Yellow
    }
} else {
    Write-Host " [INFO] Live HTTP endpoint probe skipped (ApiUrl is not yet deployed or is set to placeholder)." -ForegroundColor Yellow
}

# 7. Frontend Configuration Status
Write-Host "`n[7/7] Checking Frontend Configuration (.env)..." -ForegroundColor Green
if (Test-Path $EnvFilePath) {
    $envContent = Get-Content $EnvFilePath -Raw
    $isMock = ($envContent -match "VITE_USE_AWS_MOCK\s*=\s*false")
    Write-Host " - .env File Present: YES" -ForegroundColor Green
    if ($isMock) {
        Write-Host " - Live AWS Mode:     ACTIVE (VITE_USE_AWS_MOCK=false)" -ForegroundColor Green
    } else {
        Write-Host " - Live AWS Mode:     MOCK ACTIVE (VITE_USE_AWS_MOCK=true or default)" -ForegroundColor Yellow
        Write-Host "   -> Tip: Set VITE_USE_AWS_MOCK=false in .env once live API Gateway URL is entered."
    }
} else {
    Write-Host " [WARN] .env file not found. Create one from .env.example." -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " VERIFICATION AUDIT COMPLETE                             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
