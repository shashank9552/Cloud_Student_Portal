import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import databaseConfig from '../config/databaseConfig.js';

/**
 * Low-level DynamoDB Client
 */
const rawClient = new DynamoDBClient({
  region: databaseConfig.region,
  endpoint: databaseConfig.endpoint,
});

/**
 * Reusable Document Client
 * Handles automatic JavaScript object marshalling and unmarshalling
 */
export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export default docClient;
