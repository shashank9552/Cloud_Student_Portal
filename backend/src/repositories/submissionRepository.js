import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import docClient from '../utils/dynamodbClient.js';
import databaseConfig from '../config/databaseConfig.js';
import { randomUUID } from 'crypto';

export const submissionRepository = {
  /**
   * Create a new student submission
   * Supports multiple submissions and revisions without overwriting previous ones
   * because submissionKey is composite: assignmentId#submittedAt
   *
   * @param {Object} data
   * @param {string} data.studentId - Cognito sub of the submitting student
   * @param {string} data.assignmentId - Assignment UUID
   * @param {string} data.fileName - Uploaded PDF file name
   * @param {string} data.s3FileKey - S3 Object key (e.g. submissions/asn-101/usr-123/file.pdf)
   * @param {string} [data.remarks] - Student notes or references
   * @param {number} [data.maxMarks=100] - Total marks reference
   */
  createSubmission: async (data) => {
    if (!data.studentId) throw new Error('studentId (Cognito sub) is required.');
    if (!data.assignmentId) throw new Error('assignmentId is required.');

    const submittedAt = data.submittedAt || new Date().toISOString();
    const submissionId = data.submissionId || `sub-${randomUUID().slice(0, 8)}`;
    // Composite sort key ensuring immutable revision history
    const submissionKey = `${data.assignmentId}#${submittedAt}`;

    const item = {
      studentId: data.studentId,
      submissionKey,
      submissionId,
      assignmentId: data.assignmentId,
      submittedAt,
      fileName: data.fileName,
      s3FileKey: data.s3FileKey || `submissions/${data.assignmentId}/${data.studentId}/${data.fileName}`,
      remarks: data.remarks || '',
      status: 'Pending', // Pending, Reviewed, Approved, Rejected
      marks: null,
      maxMarks: data.maxMarks || 100,
      facultyFeedback: null,
      reviewedBy: null,
      reviewedAt: null,
      // Metadata fields for UI convenience
      studentName: data.studentName || 'Student',
      studentRoll: data.studentRoll || 'N/A',
      studentEmail: data.studentEmail || '',
      courseCode: data.courseCode || 'MCA-401',
      assignmentTitle: data.assignmentTitle || '',
    };

    const command = new PutCommand({
      TableName: databaseConfig.tables.submissions,
      Item: item,
    });

    await docClient.send(command);
    return item;
  },

  /**
   * Get a specific submission by Primary Key (studentId + submissionKey)
   * @param {string} studentId - Student Cognito sub
   * @param {string} submissionKey - assignmentId#submittedAt
   */
  getSubmissionById: async (studentId, submissionKey) => {
    if (!studentId || !submissionKey) {
      throw new Error('Both studentId and submissionKey are required.');
    }

    const command = new GetCommand({
      TableName: databaseConfig.tables.submissions,
      Key: {
        studentId,
        submissionKey,
      },
    });

    const response = await docClient.send(command);
    return response.Item || null;
  },

  /**
   * Retrieve all submissions for a given student
   * Uses Primary Key (studentId) Query; optionally filters by assignmentId
   * @param {string} studentId - Cognito sub of student
   * @param {string} [assignmentId] - Optional assignmentId filter
   */
  getStudentSubmissions: async (studentId, assignmentId = null) => {
    if (!studentId) throw new Error('studentId is required.');

    if (assignmentId) {
      // Query via StudentSubmissionsIndex (PK: studentId, SK: assignmentId)
      const command = new QueryCommand({
        TableName: databaseConfig.tables.submissions,
        IndexName: databaseConfig.indexes.submissions.studentSubmissionsIndex,
        KeyConditionExpression: 'studentId = :s AND assignmentId = :a',
        ExpressionAttributeValues: {
          ':s': studentId,
          ':a': assignmentId,
        },
      });
      const response = await docClient.send(command);
      return response.Items || [];
    }

    // Query all submissions of this student (sorted latest first)
    const command = new QueryCommand({
      TableName: databaseConfig.tables.submissions,
      KeyConditionExpression: 'studentId = :s',
      ExpressionAttributeValues: {
        ':s': studentId,
      },
      ScanIndexForward: false, // Descending order
    });

    const response = await docClient.send(command);
    return response.Items || [];
  },

  /**
   * Retrieve all submissions for an assignment across all students (Faculty review queue)
   * Uses AssignmentSubmissionsIndex GSI (PK: assignmentId, SK: submittedAt)
   * Avoids full-table scans.
   *
   * @param {string} assignmentId
   * @param {string} [statusFilter] - Optional filter by status ('Pending', 'Reviewed', etc.)
   */
  getAssignmentSubmissions: async (assignmentId, statusFilter = null) => {
    if (!assignmentId) throw new Error('assignmentId is required.');

    const params = {
      TableName: databaseConfig.tables.submissions,
      IndexName: databaseConfig.indexes.submissions.assignmentSubmissionsIndex,
      KeyConditionExpression: 'assignmentId = :aid',
      ExpressionAttributeValues: {
        ':aid': assignmentId,
      },
      ScanIndexForward: false, // Newest submissions first
    };

    if (statusFilter && statusFilter !== 'All') {
      params.FilterExpression = '#status = :st';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':st'] = statusFilter;
    }

    const command = new QueryCommand(params);
    const response = await docClient.send(command);
    return response.Items || [];
  },

  /**
   * Update submission review status (Faculty only)
   * Status can be: 'Pending', 'Reviewed', 'Approved', 'Rejected'
   *
   * @param {string} studentId
   * @param {string} submissionKey
   * @param {string} status
   * @param {string} reviewedBy - Faculty Name or Cognito sub
   */
  updateSubmissionStatus: async (studentId, submissionKey, status, reviewedBy) => {
    if (!studentId || !submissionKey) {
      throw new Error('Both studentId and submissionKey are required.');
    }

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: databaseConfig.tables.submissions,
      Key: { studentId, submissionKey },
      UpdateExpression: 'SET #status = :st, #reviewedBy = :rb, #reviewedAt = :ra',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#reviewedBy': 'reviewedBy',
        '#reviewedAt': 'reviewedAt',
      },
      ExpressionAttributeValues: {
        ':st': status,
        ':rb': reviewedBy || 'Faculty Admin',
        ':ra': now,
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  /**
   * Add or update faculty feedback and numerical marks (Faculty only)
   * Security Rule: Students cannot call this method.
   *
   * @param {string} studentId
   * @param {string} submissionKey
   * @param {Object} evaluation
   * @param {number} evaluation.marks - Numerical score
   * @param {string} evaluation.facultyFeedback - Detailed comments
   * @param {string} [evaluation.status='Reviewed'] - New status
   * @param {string} evaluation.reviewedBy - Faculty name
   */
  addFacultyFeedback: async (studentId, submissionKey, evaluation) => {
    if (!studentId || !submissionKey) {
      throw new Error('Both studentId and submissionKey are required.');
    }

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: databaseConfig.tables.submissions,
      Key: { studentId, submissionKey },
      UpdateExpression:
        'SET #marks = :m, #feedback = :fb, #status = :st, #reviewedBy = :rb, #reviewedAt = :ra',
      ExpressionAttributeNames: {
        '#marks': 'marks',
        '#feedback': 'facultyFeedback',
        '#status': 'status',
        '#reviewedBy': 'reviewedBy',
        '#reviewedAt': 'reviewedAt',
      },
      ExpressionAttributeValues: {
        ':m': Number(evaluation.marks),
        ':fb': evaluation.facultyFeedback || '',
        ':st': evaluation.status || 'Reviewed',
        ':rb': evaluation.reviewedBy || 'Faculty Admin',
        ':ra': now,
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  /**
   * Retrieve a submission by its unique submissionId attribute.
   * Priority: Query using SubmissionIdIndex GSI (O(1)).
   * Fallback: If SubmissionIdIndex is not yet created/active, gracefully fall back to Scan with filter.
   *
   * @param {string} submissionId
   */
  getSubmissionBySubmissionId: async (submissionId) => {
    if (!submissionId) throw new Error('submissionId is required.');

    // Attempt 1: Fast O(1) query using SubmissionIdIndex GSI
    try {
      const queryCmd = new QueryCommand({
        TableName: databaseConfig.tables.submissions,
        IndexName: databaseConfig.indexes.submissions.submissionIdIndex,
        KeyConditionExpression: 'submissionId = :sid',
        ExpressionAttributeValues: {
          ':sid': submissionId,
        },
        Limit: 1,
      });

      const queryRes = await docClient.send(queryCmd);
      if (queryRes.Items && queryRes.Items.length > 0) {
        return queryRes.Items[0];
      }
    } catch (err) {
      // If GSI doesn't exist yet or is creating, warn and fallback
      console.warn(
        `[submissionRepository] SubmissionIdIndex query failed (${err.message}). Falling back to Scan.`
      );
    }

    // Attempt 2: Fallback Scan with filter (safe while GSI is provisioning)
    const scanCmd = new ScanCommand({
      TableName: databaseConfig.tables.submissions,
      FilterExpression: 'submissionId = :sid',
      ExpressionAttributeValues: {
        ':sid': submissionId,
      },
      Limit: 1,
    });

    const scanRes = await docClient.send(scanCmd);
    return (scanRes.Items && scanRes.Items[0]) || null;
  },

  /**
   * Update submission review/evaluation by submissionId directly.
   * Resolves the primary key (studentId, submissionKey) first, then updates.
   *
   * @param {string} submissionId
   * @param {Object} updateData - { status, marks, facultyFeedback, reviewedBy }
   */
  updateSubmissionBySubmissionId: async (submissionId, updateData) => {
    if (!submissionId) throw new Error('submissionId is required.');

    const existing = await submissionRepository.getSubmissionBySubmissionId(submissionId);
    if (!existing) {
      throw new Error(`Submission with ID ${submissionId} not found.`);
    }

    const { studentId, submissionKey } = existing;
    const now = new Date().toISOString();

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (updateData.status) {
      updateExpressions.push('#status = :st');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':st'] = updateData.status;
    }

    if (updateData.marks !== undefined && updateData.marks !== null) {
      updateExpressions.push('#marks = :m');
      expressionAttributeNames['#marks'] = 'marks';
      expressionAttributeValues[':m'] = Number(updateData.marks);
    }

    if (updateData.facultyFeedback !== undefined) {
      updateExpressions.push('#fb = :fb');
      expressionAttributeNames['#fb'] = 'facultyFeedback';
      expressionAttributeValues[':fb'] = updateData.facultyFeedback;
    }

    if (updateData.reviewedBy) {
      updateExpressions.push('#rb = :rb');
      expressionAttributeNames['#rb'] = 'reviewedBy';
      expressionAttributeValues[':rb'] = updateData.reviewedBy;
    }

    updateExpressions.push('#ra = :ra');
    expressionAttributeNames['#ra'] = 'reviewedAt';
    expressionAttributeValues[':ra'] = now;

    const command = new UpdateCommand({
      TableName: databaseConfig.tables.submissions,
      Key: { studentId, submissionKey },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  /**
   * Retrieve all submissions across all assignments (Faculty overview)
   * @param {string} [statusFilter]
   */
  getAllSubmissions: async (statusFilter = null) => {
    const params = {
      TableName: databaseConfig.tables.submissions,
    };

    if (statusFilter && statusFilter !== 'All') {
      params.FilterExpression = '#status = :st';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues = { ':st': statusFilter };
    }

    const command = new ScanCommand(params);
    const response = await docClient.send(command);
    return response.Items || [];
  },
};

export default submissionRepository;
