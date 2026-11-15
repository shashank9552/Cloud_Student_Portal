/**
 * CloudEdu Serverless Backend
 * Central exports for Phase 4 Lambda integration & Repositories
 */

export { databaseConfig } from './config/databaseConfig.js';
export { docClient } from './utils/dynamodbClient.js';
export { s3Client } from './utils/s3Client.js';
export { userRepository } from './repositories/userRepository.js';
export { assignmentRepository } from './repositories/assignmentRepository.js';
export { submissionRepository } from './repositories/submissionRepository.js';
export { handler } from './handlers/apiRouter.js';

