/**
 * Centralized AWS Serverless Configuration
 * 
 * This file serves as the configuration contract for future AWS Serverless integration.
 * No real credentials or secret keys are stored here.
 * When ready to integrate AWS, configure environment variables in a .env file:
 * - VITE_USE_AWS_MOCK=false
 * - VITE_AWS_REGION=us-east-1
 * - VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
 * - VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
 * - VITE_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
 * - VITE_S3_BUCKET_NAME=student-portal-assignments-storage
 */

export const awsConfig = {
  // Toggle between local mock services and live AWS cloud endpoints
  isMockMode: import.meta.env.VITE_USE_AWS_MOCK !== 'false', // Defaults to TRUE for safe development

  // AWS Regional Configuration
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',

  // Amazon Cognito (Authentication & Role-Based Access Control)
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_mockUserPool',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'mockCognitoAppClientId12345',
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '',
    userGroups: {
      student: 'StudentGroup',
      faculty: 'FacultyAdminGroup',
    },
  },

  // Amazon API Gateway (REST APIs)
  apiGateway: {
    baseUrl: import.meta.env.VITE_API_GATEWAY_URL || 'https://api.mock-student-portal.cloud/prod',
    endpoints: {
      assignments: '/assignments',
      submissions: '/submissions',
      students: '/students',
      auth: '/auth',
      analytics: '/analytics',
      presignedUploadUrl: '/s3/presigned-url',
    },
  },

  // Amazon S3 (Assignment PDF File Storage)
  s3: {
    bucketName: import.meta.env.VITE_S3_BUCKET_NAME || 'cloudedu-portal-student-submissions',
    maxFileSizeMB: 10,
    allowedMimeTypes: ['application/pdf'],
    uploadPrefix: 'assignments/submissions/',
  },

  // Amazon DynamoDB (NoSQL Data Models)
  dynamoDb: {
    tables: {
      users: 'CloudEdu_Users',
      assignments: 'CloudEdu_Assignments',
      submissions: 'CloudEdu_Submissions',
      courses: 'CloudEdu_Courses',
      activityLogs: 'CloudEdu_ActivityLogs',
    },
    indexes: {
      studentSubmissionsIndex: 'StudentId-CreatedAt-index',
      assignmentSubmissionsIndex: 'AssignmentId-Status-index',
    },
  },

  // AWS CloudWatch (Observability & Logging)
  cloudWatch: {
    logGroupName: '/aws/lambda/cloudedu-portal-services',
    metricsNamespace: 'CloudEduPortal/Metrics',
  },

  // AWS Amplify Hosting Config
  amplify: {
    appName: 'cloudedu-student-portal',
    environment: import.meta.env.MODE || 'development',
  },
};

export default awsConfig;
