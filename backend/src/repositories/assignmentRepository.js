import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import docClient from '../utils/dynamodbClient.js';
import databaseConfig from '../config/databaseConfig.js';
import { randomUUID } from 'crypto';

export const assignmentRepository = {
  /**
   * Create a new coursework assignment (Faculty only)
   * @param {Object} data
   * @param {string} [data.assignmentId] - Optional existing or generated UUID
   * @param {string} data.title
   * @param {string} data.description
   * @param {string} data.courseCode - e.g. MCA-401
   * @param {string} data.deadline - ISO date string
   * @param {number} data.maxMarks - Total marks
   * @param {string[]} [data.guidelines] - Guidelines array
   * @param {string} data.createdBy - Faculty Cognito sub
   */
  createAssignment: async (data) => {
    const now = new Date().toISOString();
    const assignmentId = data.assignmentId || `asn-${randomUUID().slice(0, 8)}`;

    const item = {
      assignmentId,
      title: data.title.trim(),
      description: data.description.trim(),
      courseCode: data.courseCode.trim().toUpperCase(),
      deadline: data.deadline,
      maxMarks: Number(data.maxMarks) || 100,
      guidelines: Array.isArray(data.guidelines) ? data.guidelines : (data.instructions || []),
      createdBy: data.createdBy,
      status: data.status || 'Active', // Active or Closed
      fileAttachment: data.fileAttachment || null,
      allowLateSubmissions: Boolean(data.allowLateSubmissions),
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: databaseConfig.tables.assignments,
      Item: item,
    });

    await docClient.send(command);
    return item;
  },

  /**
   * Get an assignment by its Primary Key (assignmentId)
   * @param {string} assignmentId
   */
  getAssignmentById: async (assignmentId) => {
    if (!assignmentId) throw new Error('assignmentId is required.');

    const command = new GetCommand({
      TableName: databaseConfig.tables.assignments,
      Key: { assignmentId },
    });

    const response = await docClient.send(command);
    return response.Item || null;
  },

  /**
   * Query assignments belonging to a course via CourseCodeIndex GSI
   * Efficiently sorted chronologically by createdAt (Sort Key)
   * @param {string} courseCode - e.g. MCA-401
   * @param {boolean} [scanIndexForward=false] - true: ASC, false: DESC (latest first)
   */
  getAssignmentsByCourse: async (courseCode, scanIndexForward = false) => {
    if (!courseCode) throw new Error('courseCode is required.');

    const command = new QueryCommand({
      TableName: databaseConfig.tables.assignments,
      IndexName: databaseConfig.indexes.assignments.courseCodeIndex,
      KeyConditionExpression: 'courseCode = :code',
      ExpressionAttributeValues: {
        ':code': courseCode.trim().toUpperCase(),
      },
      ScanIndexForward: scanIndexForward,
    });

    const response = await docClient.send(command);
    return response.Items || [];
  },

  /**
   * Get all assignments with optional status filter
   * @param {string} [status] - 'Active', 'Closed', or undefined for all
   */
  getAllAssignments: async (status) => {
    const params = {
      TableName: databaseConfig.tables.assignments,
    };

    if (status && status !== 'All') {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues = { ':status': status };
    }

    const command = new ScanCommand(params);
    const response = await docClient.send(command);
    return response.Items || [];
  },

  /**
   * Update assignment problem statement, deadline, or status (Faculty only)
   * @param {string} assignmentId
   * @param {Object} updateData
   */
  updateAssignment: async (assignmentId, updateData) => {
    if (!assignmentId) throw new Error('assignmentId is required.');

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
    };

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    if (updateData.title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      updateExpressions.push('#desc = :desc');
      expressionAttributeNames['#desc'] = 'description';
      expressionAttributeValues[':desc'] = updateData.description.trim();
    }
    if (updateData.deadline !== undefined) {
      updateExpressions.push('#deadline = :deadline');
      expressionAttributeNames['#deadline'] = 'deadline';
      expressionAttributeValues[':deadline'] = updateData.deadline;
    }
    if (updateData.maxMarks !== undefined) {
      updateExpressions.push('#maxMarks = :maxMarks');
      expressionAttributeNames['#maxMarks'] = 'maxMarks';
      expressionAttributeValues[':maxMarks'] = Number(updateData.maxMarks);
    }
    if (updateData.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updateData.status;
    }
    if (updateData.guidelines !== undefined) {
      updateExpressions.push('#guidelines = :guidelines');
      expressionAttributeNames['#guidelines'] = 'guidelines';
      expressionAttributeValues[':guidelines'] = updateData.guidelines;
    }
    if (updateData.fileAttachment !== undefined) {
      updateExpressions.push('#fileAttachment = :fileAttachment');
      expressionAttributeNames['#fileAttachment'] = 'fileAttachment';
      expressionAttributeValues[':fileAttachment'] = updateData.fileAttachment;
    }

    const command = new UpdateCommand({
      TableName: databaseConfig.tables.assignments,
      Key: { assignmentId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  /**
   * Delete an assignment (Faculty only)
   * @param {string} assignmentId
   */
  deleteAssignment: async (assignmentId) => {
    if (!assignmentId) throw new Error('assignmentId is required.');

    const command = new DeleteCommand({
      TableName: databaseConfig.tables.assignments,
      Key: { assignmentId },
    });

    await docClient.send(command);
    return { success: true, assignmentId };
  },
};

export default assignmentRepository;
