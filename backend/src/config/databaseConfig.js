/**
 * Centralized DynamoDB Database Configuration
 * Configures table names, region, and GSI index names from environment variables.
 */

export const databaseConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // Set for local DynamoDB testing

  tables: {
    users: process.env.USERS_TABLE || 'CloudEdu-Users',
    assignments: process.env.ASSIGNMENTS_TABLE || 'CloudEdu-Assignments',
    submissions: process.env.SUBMISSIONS_TABLE || 'CloudEdu-Submissions',
  },

  s3: {
    submissionsBucket: process.env.SUBMISSIONS_S3_BUCKET || 'cloudedu-submissions-ap-south-1',
    urlExpirationSeconds: Number(process.env.S3_URL_EXPIRATION_SECONDS) || 900, // 15 mins
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
      submissionIdIndex: 'SubmissionIdIndex',
    },
  },
};

export default databaseConfig;
