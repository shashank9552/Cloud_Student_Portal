import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import docClient from '../utils/dynamodbClient.js';
import databaseConfig from '../config/databaseConfig.js';

export const userRepository = {
  /**
   * Create a new user record in DynamoDB (triggered upon Cognito confirmation)
   * @param {Object} user
   * @param {string} user.userId - Authenticated Cognito sub UUID
   * @param {string} user.name - Full Name
   * @param {string} user.email - Academic Email
   * @param {string} user.rollNumber - University Roll Number
   * @param {string} user.department - Academic Department
   * @param {string} user.semester - Current Semester
   * @param {string} [user.phone] - Phone number
   * @param {string} [user.role='student'] - Role derived strictly from Cognito group
   */
  createUser: async (user) => {
    if (!user.userId) {
      throw new Error('userId (Cognito sub) is required to create a user record.');
    }

    const now = new Date().toISOString();
    const item = {
      userId: user.userId,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      rollNumber: user.rollNumber ? user.rollNumber.trim() : 'N/A',
      department: user.department || 'Department of Computer Science & Engineering',
      semester: user.semester || 'Semester 4',
      phone: user.phone || '',
      role: user.role === 'faculty' ? 'faculty' : 'student', // Default to student
      createdAt: user.createdAt || now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: databaseConfig.tables.users,
      Item: item,
      ConditionExpression: 'attribute_not_exists(userId)', // Prevent accidental overwriting
    });

    await docClient.send(command);
    return item;
  },

  /**
   * Retrieve a user by their authenticated Cognito UUID (Partition Key)
   * @param {string} userId - Cognito sub
   */
  getUserById: async (userId) => {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const command = new GetCommand({
      TableName: databaseConfig.tables.users,
      Key: { userId },
    });

    const response = await docClient.send(command);
    return response.Item || null;
  },

  /**
   * Query a user by their University Roll Number via RollNumberIndex GSI
   * Avoids full-table scans.
   * @param {string} rollNumber - University Roll Number
   */
  getUserByRollNumber: async (rollNumber) => {
    if (!rollNumber) {
      throw new Error('rollNumber is required.');
    }

    const command = new QueryCommand({
      TableName: databaseConfig.tables.users,
      IndexName: databaseConfig.indexes.users.rollNumberIndex,
      KeyConditionExpression: 'rollNumber = :r',
      ExpressionAttributeValues: {
        ':r': rollNumber.trim(),
      },
      Limit: 1,
    });

    const response = await docClient.send(command);
    return response.Items && response.Items.length > 0 ? response.Items[0] : null;
  },

  /**
   * Update student contact/profile information
   * Security Rule: Users CANNOT modify their own role or userId.
   * @param {string} userId - Authenticated Cognito sub
   * @param {Object} profileData - Allowed editable attributes (phone, address, etc.)
   */
  updateUserProfile: async (userId, profileData) => {
    if (!userId) {
      throw new Error('userId is required.');
    }

    // Explicitly disallow modifying role, userId, email, or createdAt
    const { role, userId: discardedId, email, createdAt, ...allowedUpdates } = profileData;

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
    };

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    if (allowedUpdates.name) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = allowedUpdates.name.trim();
    }
    if (allowedUpdates.phone !== undefined) {
      updateExpressions.push('#phone = :phone');
      expressionAttributeNames['#phone'] = 'phone';
      expressionAttributeValues[':phone'] = allowedUpdates.phone;
    }
    if (allowedUpdates.department) {
      updateExpressions.push('#department = :department');
      expressionAttributeNames['#department'] = 'department';
      expressionAttributeValues[':department'] = allowedUpdates.department;
    }
    if (allowedUpdates.semester) {
      updateExpressions.push('#semester = :semester');
      expressionAttributeNames['#semester'] = 'semester';
      expressionAttributeValues[':semester'] = allowedUpdates.semester;
    }

    const command = new UpdateCommand({
      TableName: databaseConfig.tables.users,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  /**
   * List all registered students (Faculty only)
   * Scans Users table filtered by role = 'student'
   */
  listStudents: async () => {
    const command = new ScanCommand({
      TableName: databaseConfig.tables.users,
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': 'student' },
    });

    const response = await docClient.send(command);
    return response.Items || [];
  },
};

export default userRepository;
