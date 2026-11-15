# scripts/deploy-backend.ps1
# Interactive AWS CloudFormation Deployment Script for CloudEdu Backend (Phase 4)
# Target Region: ap-south-1 (Mumbai)
[CmdletBinding()]
param (
    [string]$Region = "ap-south-1",
    [string]$StackName = "CloudEdu-Backend-API",
    [string]$ProjectName = "CloudEdu",
    [string]$Environment = "dev",
    [string]$CognitoUserPoolId = "",
    [string]$CognitoClientId = "",
    [switch]$SkipPackage = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " CloudEdu Backend AWS Deployment (Node.js 24.x)          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Resolve Project Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

$ProjectRoot = (Resolve-Path "$ScriptDir\..").Path
$TemplatePath = Join-Path $ProjectRoot "infrastructure\cloudformation\api-backend.yaml"
$ZipPath = Join-Path $ProjectRoot "backend.zip"
$EnvFilePath = Join-Path $ProjectRoot ".env"

# 2. Check AWS CLI
Write-Host "`n[1/7] Checking AWS CLI installation and authentication..." -ForegroundColor Green
try {
    $cliVersion = & aws --version 2>&1
    Write-Host " - AWS CLI detected: $cliVersion"
} catch {
    Write-Error "AWS CLI is not installed or not in PATH. Please install AWS CLI v2 before running."
    exit 1
}

# 3. Check AWS Account & Region
try {
    $callerIdentity = (& aws sts get-caller-identity --output json | ConvertFrom-Json)
    Write-Host " - Authenticated Account: $($callerIdentity.Account)"
    Write-Host " - IAM Principal:         $($callerIdentity.Arn)"
    Write-Host " - Target Region:          $Region"
} catch {
    Write-Error "Failed to authenticate with AWS. Run 'aws configure' or check AWS credentials."
    exit 1
}

# 4. Resolve Cognito Parameters (from args or .env)
Write-Host "`n[2/7] Resolving Amazon Cognito User Pool credentials..." -ForegroundColor Green
if (-not $CognitoUserPoolId -or -not $CognitoClientId) {
    if (Test-Path $EnvFilePath) {
        $envLines = Get-Content $EnvFilePath
        foreach ($line in $envLines) {
            if ($line -match "^\s*VITE_COGNITO_USER_POOL_ID\s*=\s*(.+)$") {
                if (-not $CognitoUserPoolId) { $CognitoUserPoolId = $matches[1].Trim() }
            }
            if ($line -match "^\s*VITE_COGNITO_CLIENT_ID\s*=\s*(.+)$") {
                if (-not $CognitoClientId) { $CognitoClientId = $matches[1].Trim() }
            }
        }
    }
}

if (-not $CognitoUserPoolId -or $CognitoUserPoolId -like "*your_*" -or -not $CognitoClientId -or $CognitoClientId -like "*your_*") {
    Write-Error "Valid Cognito parameters not provided. Specify -CognitoUserPoolId and -CognitoClientId or configure .env."
    exit 1
}

Write-Host " - User Pool ID: $CognitoUserPoolId"
Write-Host " - App Client ID: $CognitoClientId"

# 5. Check DynamoDB Tables & Missing GSIs
Write-Host "`n[3/7] Verifying deployed DynamoDB tables and GSIs in $Region..." -ForegroundColor Green
$requiredTables = @(
    @{ Name = "$ProjectName-Users"; RequiredGsi = @("RollNumberIndex") },
    @{ Name = "$ProjectName-Assignments"; RequiredGsi = @("CourseCodeIndex") },
    @{ Name = "$ProjectName-Submissions"; RequiredGsi = @("AssignmentSubmissionsIndex", "StudentSubmissionsIndex", "SubmissionIdIndex") }
)

foreach ($t in $requiredTables) {
    $tableName = $t.Name
    try {
        $tableDesc = & aws dynamodb describe-table --table-name $tableName --region $Region --output json 2>$null | ConvertFrom-Json
        $tableStatus = $tableDesc.Table.TableStatus
        Write-Host " - Table $tableName : $tableStatus" -ForegroundColor Green

        $activeGsis = @($tableDesc.Table.GlobalSecondaryIndexes | ForEach-Object { $_.IndexName })
        foreach ($reqGsi in $t.RequiredGsi) {
            if ($activeGsis -contains $reqGsi) {
                Write-Host "    [OK] GSI: $reqGsi is ACTIVE" -ForegroundColor DarkGreen
            } else {
                Write-Host "    [WARN] GSI: $reqGsi is MISSING from $tableName!" -ForegroundColor Yellow
                if ($tableName -eq "$ProjectName-Submissions" -and $reqGsi -eq "SubmissionIdIndex") {
                    Write-Host "    -> Recommended: Run safe update script or apply infrastructure\dynamodb\dynamodb-submission-gsi-update.yaml" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        Write-Host " - [WARN] Table $tableName was not found in $Region. Ensure Phase 3 tables are deployed." -ForegroundColor Yellow
    }
}

# 6. Package Backend ZIP
if (-not $SkipPackage) {
    Write-Host "`n[4/7] Packaging Node.js 24.x backend bundle..." -ForegroundColor Green
    & powershell.exe -ExecutionPolicy Bypass -File (Join-Path $ScriptDir "package-backend.ps1")
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend packaging failed!"
        exit 1
    }
} else {
    Write-Host "`n[4/7] Skipping backend packaging (using existing backend.zip)..." -ForegroundColor Yellow
}

if (-not (Test-Path $ZipPath)) {
    Write-Error "backend.zip not found at $ZipPath."
    exit 1
}

# 7. Deploy CloudFormation Stack
Write-Host "`n[5/7] Deploying CloudFormation Stack: $StackName..." -ForegroundColor Green
Write-Host " - Template: $TemplatePath"
Write-Host " - Runtime: Node.js 24.x"

& aws cloudformation deploy `
    --template-file $TemplatePath `
    --stack-name $StackName `
    --parameter-overrides `
        ProjectName=$ProjectName `
        Environment=$Environment `
        CognitoUserPoolId=$CognitoUserPoolId `
        CognitoClientId=$CognitoClientId `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Error "CloudFormation deployment failed!"
    exit 1
}

# 8. Upload packaged ZIP to Lambda Function
Write-Host "`n[6/7] Updating Lambda function code with backend.zip..." -ForegroundColor Green
$functionName = "$ProjectName-Backend-API-$Environment"

& aws lambda update-function-code `
    --function-name $functionName `
    --zip-file "fileb://$ZipPath" `
    --region $Region `
    --output json | Out-Null

Write-Host " - Lambda code updated successfully: $functionName" -ForegroundColor Green

# Wait for Lambda update to complete
Write-Host " - Waiting for Lambda update status to become Successful..."
& aws lambda wait function-updated --function-name $functionName --region $Region

# 9. Retrieve and Display Outputs
Write-Host "`n[7/7] Retrieving deployed stack outputs..." -ForegroundColor Green
$stackOutputs = & aws cloudformation describe-stacks --stack-name $StackName --region $Region --output json | ConvertFrom-Json
$outputs = $stackOutputs.Stacks[0].Outputs

$apiEndpoint = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpointUrl" }).OutputValue
$s3Bucket = ($outputs | Where-Object { $_.OutputKey -eq "SubmissionsBucketName" }).OutputValue
$lambdaArn = ($outputs | Where-Object { $_.OutputKey -eq "LambdaFunctionArn" }).OutputValue

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY!                       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " API Gateway Endpoint: $apiEndpoint" -ForegroundColor Yellow
Write-Host " S3 Submissions Bucket: $s3Bucket" -ForegroundColor Yellow
Write-Host " Lambda Function ARN:   $lambdaArn" -ForegroundColor Yellow

Write-Host "`nNext Step: Update your .env file with the live values:" -ForegroundColor Cyan
Write-Host "VITE_API_GATEWAY_URL=$apiEndpoint"
Write-Host "VITE_S3_BUCKET_NAME=$s3Bucket"
Write-Host "VITE_USE_AWS_MOCK=false"
Write-Host "`nThen verify deployment by running: .\scripts\verify-deployment.ps1" -ForegroundColor Green
