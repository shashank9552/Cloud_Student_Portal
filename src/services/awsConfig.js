import { Amplify } from 'aws-amplify';

/**
 * Centralized AWS Serverless & Cognito Configuration
 * 
 * Environment variables:
 * - VITE_AWS_REGION: AWS Region (e.g. ap-south-1, us-east-1)
 * - VITE_COGNITO_USER_POOL_ID: Amazon Cognito User Pool ID
 * - VITE_COGNITO_CLIENT_ID: Amazon Cognito App Client ID (without client secret)
 */

const region = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

// Determine if real Cognito User Pool is configured
export const isCognitoConfigured = Boolean(
  userPoolId &&
  clientId &&
  !userPoolId.includes('your_') &&
  !userPoolId.includes('mock') &&
  !clientId.includes('your_') &&
  !clientId.includes('mock')
);

// Determine if real API Gateway is configured
export const isApiGatewayConfigured = Boolean(
  import.meta.env.VITE_API_GATEWAY_URL &&
  !import.meta.env.VITE_API_GATEWAY_URL.includes('mock-student-portal') &&
  !import.meta.env.VITE_API_GATEWAY_URL.includes('your_api_id') &&
  import.meta.env.VITE_USE_AWS_MOCK !== 'true'
);

export const awsConfig = {
  // Region
  region,

  // Amazon Cognito User Pools
  cognito: {
    userPoolId,
    clientId,
    isConfigured: isCognitoConfigured,
    // Cognito User Pool Groups (Case-sensitive matching AWS Cognito groups)
    groups: {
      STUDENT: 'STUDENT',
      FACULTY: 'FACULTY',
    },
    // Password policy guidelines
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
  },

  // Amazon API Gateway (Phase 3 Integration)
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

  // Amazon S3 (Phase 4 Integration)
  s3: {
    bucketName: import.meta.env.VITE_S3_BUCKET_NAME || 'cloudedu-portal-student-submissions',
    maxFileSizeMB: 10,
    allowedMimeTypes: ['application/pdf'],
    uploadPrefix: 'assignments/submissions/',
  },

  // Amazon DynamoDB Tables (Phase 3 Specification)
  dynamoDb: {
    tables: {
      users: 'CloudEdu-Users',
      assignments: 'CloudEdu-Assignments',
      submissions: 'CloudEdu-Submissions',
    },
    indexes: {
      users: {
        rollNumberIndex: 'RollNumberIndex',
      },
      assignments: {
        courseCodeIndex: 'CourseCodeIndex',
      },
      submissions: {
        assignmentSubmissionsIndex: 'AssignmentSubmissionsIndex',
        studentSubmissionsIndex: 'StudentSubmissionsIndex',
      },
    },
  },
};

// Initialize AWS Amplify v6 Auth if configured
if (isCognitoConfigured) {
  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: awsConfig.cognito.userPoolId,
          userPoolClientId: awsConfig.cognito.clientId,
          signUpVerificationMethod: 'code',
          loginWith: {
            email: true,
          },
        },
      },
    });
    console.info('[AWS Cognito] Amplify Auth successfully initialized for User Pool:', userPoolId);
  } catch (err) {
    console.error('[AWS Cognito] Failed to configure Amplify Auth:', err);
  }
} else {
  console.warn(
    '[AWS Cognito] Real User Pool credentials not found in environment variables. Running in local fallback mode.'
  );
}

export default awsConfig;
