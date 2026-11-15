# Phase 4: AWS Serverless Backend Integration Guide
## Cloud-Based Student Management & Assignment Portal
**Target Region:** `ap-south-1` (Asia Pacific - Mumbai)  
**Architecture:** AWS Lambda (Node.js 20.x) + Amazon API Gateway (HTTP API v2) + Amazon Cognito JWT Authorizer + Amazon DynamoDB + Amazon S3

---

## 1. Overview of Phase 4 Implementation

Phase 4 completes the real cloud integration for the portal:
1. **AWS Lambda Backend (`backend/src/handlers/apiRouter.js`)**:
   - Single unified ESM entrypoint with sub-routing for Users, Assignments, Submissions, and S3 Presigned URLs.
   - Enforces Role-Based Access Control (RBAC) by inspecting verified Cognito JWT token claims (`cognito:groups`).
   - Automatically handles CORS preflights with HTTP 200.

2. **Amazon API Gateway HTTP API (v2)**:
   - Configured with native Amazon Cognito JWT Authorizer (`$request.header.Authorization`).
   - Validates Cognito ID token issuer `https://cognito-idp.ap-south-1.amazonaws.com/<userPoolId>` and audience `<clientId>`.
   - `$default` route integrated via `AWS_PROXY` payload v2 to the Lambda function.
   - Public route `GET /health` for monitoring without authorization.

3. **Amazon S3 Private Document Storage**:
   - Private S3 Bucket with Block Public Access, server-side AES256 encryption, and CORS configuration.
   - Presigned PUT URLs (`/s3/upload-url`): Allows students to upload PDF reports directly from the browser to S3 without piping large binary payloads through Lambda.
   - Presigned GET URLs (`/s3/download-url`): Allows authorized students and faculty to securely stream or download submissions.

4. **Amazon DynamoDB Schema Optimization**:
   - CloudFormation update template `infrastructure/dynamodb/dynamodb-submission-gsi-update.yaml` to add `SubmissionIdIndex` (PK: `submissionId`) to `CloudEdu-Submissions`.
   - Allows point lookups for individual submission evaluation (`/submissions/:id`) without performing full table scans.

5. **Frontend Dual-Mode Resilience**:
   - When `VITE_USE_AWS_MOCK=false` and `VITE_API_GATEWAY_URL` is set, the frontend transmits verified Cognito ID tokens to API Gateway.
   - If offline or backend is unconfigured, the frontend automatically falls back to local storage without breaking user experience.

---

## 2. Step-by-Step Deployment Instructions

### Prerequisites
- AWS CLI installed and configured with administrator access in `ap-south-1`.
- Verified Phase 2 Cognito User Pool (`VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`).
- Active Phase 3 DynamoDB tables (`CloudEdu-Users`, `CloudEdu-Assignments`, `CloudEdu-Submissions`).

---

### Step 1: Add `SubmissionIdIndex` GSI to DynamoDB (Zero Downtime)

To enable $O(1)$ single-submission lookups by `submissionId`, update the existing DynamoDB stack or apply the GSI update:

```bash
# Option A: CloudFormation Stack Update (if stack was created via CloudFormation)
aws cloudformation update-stack \
  --stack-name CloudEdu-DynamoDB \
  --template-body file://infrastructure/dynamodb/dynamodb-submission-gsi-update.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=CloudEdu ParameterKey=Environment,ParameterValue=dev \
  --region ap-south-1

# Option B: AWS CLI Direct Table Update
aws dynamodb update-table \
  --table-name CloudEdu-Submissions \
  --attribute-definitions AttributeName=submissionId,AttributeType=S \
  --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"SubmissionIdIndex\",\"KeySchema\":[{\"AttributeName\":\"submissionId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
  --region ap-south-1
```

> **Note:** The backend code is backward-compatible. If `SubmissionIdIndex` is still creating, `submissionRepository.js` automatically falls back to a filtered scan until the index reaches `ACTIVE` state.

---

### Step 2: Package Backend Lambda Code Bundle

Package the Node.js backend files into a deployable zip archive:

```powershell
# From the project root:
cd backend
npm install --production

# Create zip archive (PowerShell)
Compress-Archive -Path src/*,package.json,node_modules -DestinationPath ../backend.zip -Force
cd ..
```

*(On Linux / macOS bash: `zip -r ../backend.zip src/ package.json node_modules/`)*

---

### Step 3: Deploy Backend CloudFormation Stack

Deploy the API Gateway, S3 Bucket, IAM Execution Role, and Lambda Function:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/api-backend.yaml \
  --stack-name CloudEdu-Backend-API \
  --parameter-overrides \
      ProjectName=CloudEdu \
      Environment=dev \
      CognitoUserPoolId=<YOUR_COGNITO_USER_POOL_ID> \
      CognitoClientId=<YOUR_COGNITO_CLIENT_ID> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
```

After CloudFormation finishes provisioning, update the Lambda function with the packaged code:

```bash
aws lambda update-function-code \
  --function-name CloudEdu-Backend-API-dev \
  --zip-file fileb://backend.zip \
  --region ap-south-1
```

---

### Step 4: Retrieve Deployed Outputs

Run the following command to retrieve your API Gateway URL and S3 Bucket Name:

```bash
aws cloudformation describe-stacks \
  --stack-name CloudEdu-Backend-API \
  --region ap-south-1 \
  --query "Stacks[0].Outputs" \
  --output table
```

Sample output:
| OutputKey | OutputValue |
|---|---|
| `ApiEndpointUrl` | `https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com` |
| `SubmissionsBucketName` | `cloudedu-backend-api-submissions-123456789012-ap-south-1` |
| `LambdaFunctionArn` | `arn:aws:lambda:ap-south-1:123456789012:function:CloudEdu-Backend-API-dev` |

---

### Step 5: Update Frontend Environment Variables (`.env`)

In your local `.env` file (copied from `.env.example`), update the following keys:

```ini
VITE_AWS_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=ap-south-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_GATEWAY_URL=https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com
VITE_S3_BUCKET_NAME=cloudedu-backend-api-submissions-123456789012-ap-south-1
VITE_USE_AWS_MOCK=false
```

Rebuild and start the frontend:
```bash
npm run build
npm run dev
```

---

## 3. Postman API Testing & Verification

1. Open Postman and import `postman/CloudEdu-API.postman_collection.json`.
2. In the Collection Variables tab, configure:
   - `baseUrl`: Your deployed API Gateway endpoint URL (e.g. `https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com`).
   - `idToken`: The Cognito ID Token obtained upon successful login.
3. Test endpoints sequentially:
   - **`GET /health`**: Expect `200 OK` (Public).
   - **`GET /users/profile`**: Expect `200 OK` with user details from `CloudEdu-Users`.
   - **`GET /assignments`**: Expect `200 OK` with active coursework items.
   - **`POST /s3/upload-url`**: Expect `200 OK` with a valid `uploadUrl` and `fileKey`.
   - **`POST /submissions`**: Expect `201 Created` with a new submission item.
   - **`GET /submissions/my`**: Expect `200 OK` showing the student's submission.
   - **`GET /users/students` (as Student)**: Expect `403 Forbidden` (RBAC verified).
   - **`GET /users/students` (as Faculty)**: Expect `200 OK` listing registered students.
   - **`PATCH /submissions/{id}/review` (as Faculty)**: Expect `200 OK` with updated status.
