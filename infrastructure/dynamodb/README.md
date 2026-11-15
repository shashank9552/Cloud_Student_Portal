# Amazon DynamoDB Database Architecture & Infrastructure Deployment
## Cloud-Based Student Management & Assignment Portal

This directory contains the Infrastructure as Code (IaC) CloudFormation template and design specifications for the Amazon DynamoDB database tier supporting the Student Management & Assignment Portal.

---

## 🏛️ Database Architecture Overview

The database layer follows the **AWS Well-Architected Serverless Framework** principles:
- **No Direct Frontend Access:** DynamoDB is never queried directly from the browser; it is accessed solely by authenticated AWS Lambda microservices (implemented in Phase 4).
- **Zero Idle Cost:** Configured with `PAY_PER_REQUEST` on-demand billing, ensuring 100% compliance with AWS Free Tier with no hourly charges.
- **Data Security:** Server-Side Encryption (SSE) enabled by default; Point-in-Time Recovery (PITR) enabled for continuous automated backups.
- **Identity Bound:** Every record is indexed and bound to the cryptographically verified Amazon Cognito `sub` (UUID).

---

## 📋 Data Model & Table Specifications

### 1. `CloudEdu-Users` Table
Stores student profiles and faculty records.

| Attribute | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`userId`** | String | **Partition Key (HASH)** | Authenticated Amazon Cognito `sub` UUID |
| `name` | String | - | Full name of the user |
| `email` | String | - | Institutional academic email |
| `rollNumber` | String | **GSI Partition Key** | University enrollment roll number |
| `department` | String | - | Academic department (e.g. CSE / MCA) |
| `semester` | String | - | Current active semester |
| `phone` | String | - | Contact phone number |
| `role` | String | - | `student` or `faculty` (Cognito group verified) |
| `createdAt` | String | - | ISO-8601 creation timestamp |
| `updatedAt` | String | - | ISO-8601 update timestamp |

#### Global Secondary Indexes (GSIs):
- **`RollNumberIndex`**:
  - Partition Key: `rollNumber` (String)
  - Projection: `ALL`
  - Usage: Allows instant lookup of a student by university roll number without full-table scans.

---

### 2. `CloudEdu-Assignments` Table
Stores coursework problem statements, instructions, and deadlines.

| Attribute | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`assignmentId`** | String | **Partition Key (HASH)** | Unique assignment UUID |
| `title` | String | - | Title of the coursework |
| `description` | String | - | Comprehensive problem statement |
| `courseCode` | String | **GSI Partition Key** | e.g. `MCA-401`, `MCA-402` |
| `deadline` | String | - | ISO-8601 submission deadline |
| `maxMarks` | Number | - | Total maximum marks |
| `guidelines` | List | - | Step-by-step instructions list |
| `createdBy` | String | - | Faculty Cognito `userId` who created the assignment |
| `status` | String | - | `Active` or `Closed` |
| `createdAt` | String | **GSI Sort Key** | ISO-8601 creation timestamp |
| `updatedAt` | String | - | ISO-8601 modification timestamp |

#### Global Secondary Indexes (GSIs):
- **`CourseCodeIndex`**:
  - Partition Key: `courseCode` (String)
  - Sort Key: `createdAt` (String)
  - Projection: `ALL`
  - Usage: Efficiently queries all assignments for a specific course ordered chronologically.

---

### 3. `CloudEdu-Submissions` Table
Stores student assignment submissions and faculty evaluation results.

| Attribute | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| **`studentId`** | String | **Partition Key (HASH)** | Student's Cognito `userId` (`sub`) |
| **`submissionKey`** | String | **Sort Key (RANGE)** | Composite key: `assignmentId#submittedAt` |
| `submissionId` | String | - | Unique submission UUID |
| `assignmentId` | String | GSI Key | Associated assignment ID |
| `submittedAt` | String | GSI Key | ISO-8601 submission timestamp |
| `fileName` | String | - | Name of uploaded PDF document |
| `s3FileKey` | String | - | Amazon S3 object key |
| `remarks` | String | - | Optional student remarks / GitHub links |
| `status` | String | - | `Pending`, `Reviewed`, `Approved`, `Rejected` |
| `marks` | Number | - | Awarded grade score |
| `facultyFeedback` | String | - | Written instructor review remarks |
| `reviewedBy` | String | - | Faculty name / ID who evaluated the paper |
| `reviewedAt` | String | - | ISO-8601 review timestamp |

#### Why Composite Sort Key (`assignmentId#submittedAt`)?
By combining `assignmentId` and `submittedAt` into `submissionKey`, a student can submit multiple versions or resubmit corrections without overwriting previous historical submissions. The latest submission can be queried by sorting descending on `submissionKey`.

#### Global Secondary Indexes (GSIs):
1. **`AssignmentSubmissionsIndex`**:
   - Partition Key: `assignmentId` (String)
   - Sort Key: `submittedAt` (String)
   - Projection: `ALL`
   - Usage: Powers the faculty review queue; retrieves all student submissions for a given assignment sorted by submission date.
2. **`StudentSubmissionsIndex`**:
   - Partition Key: `studentId` (String)
   - Sort Key: `assignmentId` (String)
   - Projection: `ALL`
   - Usage: Quickly retrieves all submissions by a student for a specific assignment to check submission status.

---

## 🚀 How to Deploy via AWS CloudFormation

### Option 1: Via AWS Management Console
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/cloudformation).
2. Select your target region (e.g. `ap-south-1` Asia Pacific - Mumbai).
3. Click **Create stack** > **With new resources (standard)**.
4. Select **Template is ready** > **Upload a template file**.
5. Upload `infrastructure/dynamodb/dynamodb-tables.yaml`.
6. Enter Stack Name: `CloudEdu-Database-Stack`.
7. Configure Parameters:
   - `ProjectName`: `CloudEdu`
   - `Environment`: `dev`
8. Click **Next** through default options and click **Submit**.
9. The stack will create all 3 tables and 4 GSIs in under 2 minutes.

### Option 2: Via AWS CLI
```bash
# Validate CloudFormation template syntax
aws cloudformation validate-template \
  --template-body file://infrastructure/dynamodb/dynamodb-tables.yaml \
  --region ap-south-1

# Deploy Stack
aws cloudformation deploy \
  --template-file infrastructure/dynamodb/dynamodb-tables.yaml \
  --stack-name CloudEdu-Database-Stack \
  --parameter-overrides ProjectName=CloudEdu Environment=dev \
  --region ap-south-1 \
  --tags Project=CloudEdu Environment=dev
```

---

## 🔍 How to Verify in AWS Console
1. Open the [Amazon DynamoDB Console](https://console.aws.amazon.com/dynamodb).
2. Click **Tables** in the left sidebar.
3. Verify that the following 3 tables exist with status **Active**:
   - `CloudEdu-Users` (GSI: `RollNumberIndex`)
   - `CloudEdu-Assignments` (GSI: `CourseCodeIndex`)
   - `CloudEdu-Submissions` (GSIs: `AssignmentSubmissionsIndex`, `StudentSubmissionsIndex`)
4. Confirm **Capacity mode** is set to **On-demand** (`PAY_PER_REQUEST`).
5. Confirm **Encryption at rest** is **Enabled (Default)**.

---

## 💰 Billing & Free Tier Considerations

- **On-Demand Mode (`PAY_PER_REQUEST`):**
  - **Zero Idle Cost:** If no read or write requests occur, DynamoDB charges \$0.00.
  - **AWS Free Tier:** Includes **25 GB** of data storage per month, **25 WCU** and **25 RCU** of provisioned capacity, and **2.5 million read/write request units** on-demand.
  - Completely sufficient for MCA evaluation and university portfolio demonstrations with zero bill risk.

---

## 🔗 How Phase 4 Lambda Microservices Will Connect

In **Phase 4**, Node.js AWS Lambda functions running behind Amazon API Gateway will interact with these tables using the repository pattern located in `backend/src/repositories/`.

The Lambda Execution Role will require the following least-privilege IAM policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:*:table/CloudEdu-*",
        "arn:aws:dynamodb:ap-south-1:*:table/CloudEdu-*/index/*"
      ]
    }
  ]
}
```
Cognito JWT tokens sent by the React frontend in the `Authorization: Bearer <token>` header will be validated by the Lambda authorizer, ensuring users can only read or write authorized data.
