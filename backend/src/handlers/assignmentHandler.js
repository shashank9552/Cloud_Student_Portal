/**
 * Assignment Management Handlers
 * Enforces Faculty-only controls for creation, modification, and deletion.
 */
import assignmentRepository from '../repositories/assignmentRepository.js';
import { getAuthContext, requireAuth, requireFaculty } from '../utils/authContext.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const assignmentHandler = {
  /**
   * GET /api/assignments
   * Public or Authenticated: List assignments with optional ?status= or ?courseCode= filter
   */
  listAssignments: async (event) => {
    try {
      const queryParams = event.queryStringParameters || {};
      const { status, courseCode } = queryParams;

      let assignments = [];
      if (courseCode) {
        assignments = await assignmentRepository.getAssignmentsByCourse(courseCode);
        if (status && status !== 'All') {
          assignments = assignments.filter((a) => a.status === status);
        }
      } else {
        assignments = await assignmentRepository.getAllAssignments(status);
      }

      // Sort newest first by deadline or createdAt
      assignments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return successResponse(assignments);
    } catch (err) {
      console.error('[assignmentHandler.listAssignments] Error:', err);
      return errorResponse(err.message, 500);
    }
  },

  /**
   * GET /api/assignments/{id}
   */
  getAssignment: async (event) => {
    try {
      const assignmentId =
        event.pathParameters?.id || event.pathParameters?.assignmentId;
      if (!assignmentId) {
        return errorResponse('Assignment ID is required in path.', 400);
      }

      const item = await assignmentRepository.getAssignmentById(assignmentId);
      if (!item) {
        return errorResponse(`Assignment '${assignmentId}' not found.`, 404);
      }

      return successResponse(item);
    } catch (err) {
      console.error('[assignmentHandler.getAssignment] Error:', err);
      return errorResponse(err.message, 500);
    }
  },

  /**
   * POST /api/assignments
   * Faculty only
   */
  createAssignment: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});

      // Validation
      if (!body.title || !body.description || !body.courseCode || !body.deadline) {
        return errorResponse('Missing required fields: title, description, courseCode, deadline.', 400);
      }

      const payload = {
        ...body,
        createdBy: auth.userId,
      };

      const created = await assignmentRepository.createAssignment(payload);
      return successResponse(created, 201, 'Assignment created successfully.');
    } catch (err) {
      console.error('[assignmentHandler.createAssignment] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * PUT /api/assignments/{id}
   * Faculty only
   */
  updateAssignment: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const assignmentId =
        event.pathParameters?.id || event.pathParameters?.assignmentId;
      if (!assignmentId) {
        return errorResponse('Assignment ID is required in path.', 400);
      }

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const updated = await assignmentRepository.updateAssignment(assignmentId, body);

      return successResponse(updated, 200, 'Assignment updated successfully.');
    } catch (err) {
      console.error('[assignmentHandler.updateAssignment] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * DELETE /api/assignments/{id}
   * Faculty only
   */
  deleteAssignment: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const assignmentId =
        event.pathParameters?.id || event.pathParameters?.assignmentId;
      if (!assignmentId) {
        return errorResponse('Assignment ID is required in path.', 400);
      }

      await assignmentRepository.deleteAssignment(assignmentId);
      return successResponse({ deleted: true, assignmentId }, 200, 'Assignment deleted successfully.');
    } catch (err) {
      console.error('[assignmentHandler.deleteAssignment] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },
};

export default assignmentHandler;
