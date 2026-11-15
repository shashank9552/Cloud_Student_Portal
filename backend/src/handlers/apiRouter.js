/**
 * Central Lambda API Router Entrypoint
 * Handles HTTP API v2 and REST API requests, CORS preflights, route matching,
 * and delegates to domain-specific handlers.
 */
import { buildResponse, errorResponse, successResponse } from '../utils/response.js';
import userHandler from './userHandler.js';
import assignmentHandler from './assignmentHandler.js';
import submissionHandler from './submissionHandler.js';
import s3Handler from './s3Handler.js';

export const handler = async (event, context) => {
  // Prevent Lambda from hanging if event loop has background tasks
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // 1. Extract Method and Path (Defensive for both HTTP API v2 and REST API v1)
  const method = (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    'GET'
  ).toUpperCase();

  const rawPath =
    event.rawPath ||
    event.path ||
    event.requestContext?.http?.path ||
    '/';

  // 2. Handle CORS Preflight OPTIONS Request immediately
  if (method === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS OK' });
  }

  // 3. Normalize Path (strip stage or /api prefix for consistent routing)
  let path = rawPath;
  if (path.startsWith('/prod')) path = path.replace(/^\/prod/, '');
  if (path.startsWith('/dev')) path = path.replace(/^\/dev/, '');
  if (path.startsWith('/api')) path = path.replace(/^\/api/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  // Strip trailing slash if present (except root)
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  console.log(`[Router] Received ${method} ${rawPath} -> normalized: ${path}`);

  // Helper to ensure pathParameters exist on event
  const ensurePathParams = (params) => {
    event.pathParameters = {
      ...(event.pathParameters || {}),
      ...params,
    };
  };

  try {
    // ----------------------------------------------------
    // Health Check Endpoint
    // ----------------------------------------------------
    if (method === 'GET' && (path === '' || path === '/' || path === '/health')) {
      return successResponse({
        status: 'online',
        service: 'CloudEdu Serverless API',
        region: process.env.AWS_REGION || 'ap-south-1',
        timestamp: new Date().toISOString(),
      });
    }

    // ----------------------------------------------------
    // User & Student Profile Routes
    // ----------------------------------------------------
    if (path === '/users/profile') {
      if (method === 'GET') return await userHandler.getProfile(event);
      if (method === 'PUT') return await userHandler.updateProfile(event);
    }

    if (path === '/users/students' && method === 'GET') {
      return await userHandler.listStudents(event);
    }

    // ----------------------------------------------------
    // S3 Presigned URL Routes
    // ----------------------------------------------------
    if (path === '/s3/upload-url' && method === 'POST') {
      return await s3Handler.getUploadUrl(event);
    }

    if (path === '/s3/download-url' && method === 'GET') {
      return await s3Handler.getDownloadUrl(event);
    }

    // ----------------------------------------------------
    // Submissions Routes
    // ----------------------------------------------------
    if (path === '/submissions/my' && method === 'GET') {
      return await submissionHandler.getMySubmissions(event);
    }

    if (path === '/submissions') {
      if (method === 'POST') return await submissionHandler.createSubmission(event);
      if (method === 'GET') return await submissionHandler.listSubmissions(event);
    }

    // Match /submissions/{id}/review or /submissions/{id}
    const submissionReviewMatch = path.match(/^\/submissions\/([^/]+)\/review$/);
    if (submissionReviewMatch && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
      ensurePathParams({ id: submissionReviewMatch[1], submissionId: submissionReviewMatch[1] });
      return await submissionHandler.gradeSubmission(event);
    }

    const singleSubmissionMatch = path.match(/^\/submissions\/([^/]+)$/);
    if (singleSubmissionMatch) {
      const submissionId = singleSubmissionMatch[1];
      ensurePathParams({ id: submissionId, submissionId });
      if (method === 'GET') return await submissionHandler.getSubmissionById(event);
      if (method === 'PUT' || method === 'PATCH') return await submissionHandler.gradeSubmission(event);
    }

    // ----------------------------------------------------
    // Assignments Routes
    // ----------------------------------------------------
    if (path === '/assignments') {
      if (method === 'GET') return await assignmentHandler.listAssignments(event);
      if (method === 'POST') return await assignmentHandler.createAssignment(event);
    }

    // Match /assignments/{assignmentId}/submissions
    const assignmentSubmissionsMatch = path.match(/^\/assignments\/([^/]+)\/submissions$/);
    if (assignmentSubmissionsMatch && method === 'GET') {
      ensurePathParams({
        assignmentId: assignmentSubmissionsMatch[1],
        id: assignmentSubmissionsMatch[1],
      });
      return await submissionHandler.getAssignmentSubmissions(event);
    }

    // Match /assignments/{assignmentId}
    const singleAssignmentMatch = path.match(/^\/assignments\/([^/]+)$/);
    if (singleAssignmentMatch) {
      const assignmentId = singleAssignmentMatch[1];
      ensurePathParams({ id: assignmentId, assignmentId });

      if (method === 'GET') return await assignmentHandler.getAssignment(event);
      if (method === 'PUT' || method === 'PATCH') return await assignmentHandler.updateAssignment(event);
      if (method === 'DELETE') return await assignmentHandler.deleteAssignment(event);
    }

    // ----------------------------------------------------
    // 404 Route Not Found
    // ----------------------------------------------------
    return errorResponse(`Endpoint not found: [${method}] ${rawPath}`, 404);
  } catch (err) {
    console.error('[Router Uncaught Exception]:', err);
    return errorResponse(err.message || 'Internal Server Error', err.statusCode || 500);
  }
};

export default { handler };
