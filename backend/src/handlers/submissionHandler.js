/**
 * Student Submissions and Faculty Grading Handlers
 */
import submissionRepository from '../repositories/submissionRepository.js';
import assignmentRepository from '../repositories/assignmentRepository.js';
import { verifyS3ObjectExists } from '../utils/s3Client.js';
import {
  getAuthContext,
  requireAuth,
  requireFaculty,
  requireSelfOrFaculty,
  isFaculty,
} from '../utils/authContext.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const submissionHandler = {
  /**
   * POST /api/submissions
   * Student submits an assignment (after uploading PDF to S3 via presigned URL)
   * Verifies the actual S3 object existence, size limit (10MB), and student path ownership.
   */
  createSubmission: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { assignmentId, fileName, s3FileKey, remarks, studentRoll, studentName } = body;

      if (!assignmentId || !fileName || !s3FileKey) {
        return errorResponse('assignmentId, fileName, and s3FileKey are required.', 400);
      }

      // Security check: Enforce PDF file type
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        return errorResponse('Only PDF files are permitted for assignment submissions.', 400);
      }

      // Security check: Assert that the student owns the S3 object path
      const expectedPathPrefix = `submissions/${assignmentId}/${auth.userId}/`;
      if (!s3FileKey.startsWith(expectedPathPrefix)) {
        return errorResponse(
          'Security Error: s3FileKey must belong to the authenticated student and assignment.',
          403
        );
      }

      // Verify that assignment exists
      const assignment = await assignmentRepository.getAssignmentById(assignmentId);
      if (!assignment) {
        return errorResponse(`Assignment '${assignmentId}' not found.`, 404);
      }

      // Check if assignment is closed (unless late submissions allowed)
      if (assignment.status === 'Closed' && !assignment.allowLateSubmissions) {
        return errorResponse('This assignment is closed and no longer accepting submissions.', 400);
      }

      // Verify actual S3 object existence & 10 MB limit if running with AWS credentials
      const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
      if (process.env.AWS_EXECUTION_ENV || process.env.VERIFY_S3_SUBMISSIONS === 'true') {
        const s3Object = await verifyS3ObjectExists(s3FileKey);
        if (!s3Object.exists) {
          return errorResponse(
            'Submission document not found in the S3 bucket. Ensure your PDF has completed uploading before submitting.',
            400
          );
        }
        if (s3Object.contentLength && s3Object.contentLength > MAX_SIZE_BYTES) {
          return errorResponse('The uploaded document exceeds the maximum allowed size of 10 MB.', 400);
        }
      }

      const item = await submissionRepository.createSubmission({
        studentId: auth.userId,
        studentEmail: auth.email,
        studentName: auth.name || studentName || 'Student',
        studentRoll: auth.rollNumber || studentRoll || 'N/A',
        assignmentId,
        assignmentTitle: assignment.title,
        courseCode: assignment.courseCode,
        maxMarks: assignment.maxMarks || 100,
        fileName,
        s3FileKey,
        remarks: remarks || '',
      });

      return successResponse(item, 201, 'Assignment submitted successfully.');
    } catch (err) {
      console.error('[submissionHandler.createSubmission] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/submissions/my
   * Student views all their own submissions
   */
  getMySubmissions: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const submissions = await submissionRepository.getStudentSubmissions(auth.userId);
      return successResponse(submissions);
    } catch (err) {
      console.error('[submissionHandler.getMySubmissions] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/submissions
   * Faculty: Lists all submissions across courses (with optional ?status= filter)
   * Student: Lists own submissions
   */
  listSubmissions: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const query = event.queryStringParameters || {};
      const statusFilter = query.status;

      if (isFaculty(auth)) {
        const submissions = await submissionRepository.getAllSubmissions(statusFilter);
        return successResponse(submissions);
      } else {
        const submissions = await submissionRepository.getStudentSubmissions(auth.userId);
        return successResponse(submissions);
      }
    } catch (err) {
      console.error('[submissionHandler.listSubmissions] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/assignments/{assignmentId}/submissions
   * Faculty views all submissions for a particular assignment
   */
  getAssignmentSubmissions: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const assignmentId =
        event.pathParameters?.assignmentId || event.pathParameters?.id;
      if (!assignmentId) {
        return errorResponse('assignmentId is required in path.', 400);
      }

      const query = event.queryStringParameters || {};
      const statusFilter = query.status;

      const submissions = await submissionRepository.getAssignmentSubmissions(
        assignmentId,
        statusFilter
      );

      return successResponse(submissions);
    } catch (err) {
      console.error('[submissionHandler.getAssignmentSubmissions] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/submissions/{id}
   * Student views their own submission details or Faculty views any submission
   */
  getSubmissionById: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const submissionId =
        event.pathParameters?.id || event.pathParameters?.submissionId;
      if (!submissionId) {
        return errorResponse('submissionId is required in path.', 400);
      }

      const item = await submissionRepository.getSubmissionBySubmissionId(submissionId);
      if (!item) {
        return errorResponse(`Submission '${submissionId}' not found.`, 404);
      }

      // Check authorization
      requireSelfOrFaculty(auth, item.studentId);

      return successResponse(item);
    } catch (err) {
      console.error('[submissionHandler.getSubmissionById] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * PATCH or PUT /api/submissions/{id}/review (or /api/submissions/{id})
   * Faculty updates submission evaluation: marks, status, feedback
   */
  gradeSubmission: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const submissionId =
        event.pathParameters?.id || event.pathParameters?.submissionId;
      if (!submissionId) {
        return errorResponse('submissionId is required in path.', 400);
      }

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { marks, facultyFeedback, status } = body;

      const updated = await submissionRepository.updateSubmissionBySubmissionId(submissionId, {
        marks,
        facultyFeedback,
        status: status || 'Reviewed',
        reviewedBy: auth.name || auth.email || 'Faculty Reviewer',
      });

      return successResponse(updated, 200, 'Submission evaluated successfully.');
    } catch (err) {
      console.error('[submissionHandler.gradeSubmission] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },
};

export default submissionHandler;
