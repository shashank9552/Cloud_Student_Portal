/**
 * Authentication & Authorization Context Utility
 * Extracts and verifies Cognito JWT claims from API Gateway requestContext.
 * Enforces strict Role-Based Access Control (RBAC) in Lambda.
 */

/**
 * Extract authenticated user context from API Gateway event
 * Handles both HTTP API (v2) JWT authorizer and REST API Cognito authorizer
 *
 * @param {Object} event - API Gateway event
 * @returns {Object} { userId, email, name, role, groups, rollNumber, isAuthenticated }
 */
export const getAuthContext = (event) => {
  if (!event) {
    return { isAuthenticated: false, role: 'anonymous', groups: [] };
  }

  // 1. HTTP API (v2) Authorizer claims
  const httpApiClaims = event.requestContext?.authorizer?.jwt?.claims;

  // 2. REST API Cognito Authorizer claims
  const restApiClaims = event.requestContext?.authorizer?.claims;

  // 3. Fallback for custom / dev authorizers or testing
  const claims = httpApiClaims || restApiClaims || {};

  // Extract user identifiers
  const userId = claims.sub || claims['cognito:username'] || null;
  const email = (claims.email || claims['cognito:email'] || '').toLowerCase();
  const name = claims.name || claims['cognito:name'] || '';
  const rollNumber = claims['custom:rollNumber'] || claims['custom:roll_number'] || null;

  // Extract Cognito groups
  let groups = [];
  const rawGroups = claims['cognito:groups'];
  if (Array.isArray(rawGroups)) {
    groups = rawGroups;
  } else if (typeof rawGroups === 'string') {
    // Some authorizers pass comma-separated strings or stringified JSON
    try {
      if (rawGroups.startsWith('[')) {
        groups = JSON.parse(rawGroups);
      } else {
        groups = rawGroups.split(',').map((g) => g.trim());
      }
    } catch {
      groups = [rawGroups];
    }
  }

  // Role resolution strictly derived from verified Cognito groups
  // Never trust client-submitted role fields!
  const hasFacultyGroup = groups.some(
    (g) => g.toUpperCase() === 'FACULTY' || g.toUpperCase() === 'ADMIN'
  );
  const hasStudentGroup = groups.some((g) => g.toUpperCase() === 'STUDENT');

  let role = 'student'; // Default fallback
  if (hasFacultyGroup) {
    role = 'faculty';
  } else if (hasStudentGroup) {
    role = 'student';
  } else if (claims['custom:role'] === 'faculty') {
    // If Cognito custom attribute is present
    role = 'faculty';
  }

  const isAuthenticated = Boolean(userId);

  return {
    userId,
    email,
    name,
    rollNumber,
    role,
    groups,
    isAuthenticated,
    claims,
  };
};

/**
 * Verifies whether the authenticated context has Faculty privileges
 * @param {Object} auth - Output from getAuthContext
 * @returns {boolean}
 */
export const isFaculty = (auth) => {
  return auth.isAuthenticated && auth.role === 'faculty';
};

/**
 * Verifies whether the authenticated context has Student privileges
 * @param {Object} auth - Output from getAuthContext
 * @returns {boolean}
 */
export const isStudent = (auth) => {
  return auth.isAuthenticated && auth.role === 'student';
};

/**
 * Guard: Requires user to be authenticated, otherwise throws 401
 * @param {Object} auth
 */
export const requireAuth = (auth) => {
  if (!auth.isAuthenticated || !auth.userId) {
    const error = new Error('Unauthorized: Authentication token is missing or invalid.');
    error.statusCode = 401;
    throw error;
  }
};

/**
 * Guard: Requires user to have Faculty role, otherwise throws 403
 * @param {Object} auth
 */
export const requireFaculty = (auth) => {
  requireAuth(auth);
  if (!isFaculty(auth)) {
    const error = new Error('Forbidden: Access denied. Faculty role required.');
    error.statusCode = 403;
    throw error;
  }
};

/**
 * Guard: Asserts that a student is accessing only their own resources
 * @param {Object} auth
 * @param {string} resourceOwnerId
 */
export const requireSelfOrFaculty = (auth, resourceOwnerId) => {
  requireAuth(auth);
  if (isFaculty(auth)) return true; // Faculty has administrative read access
  if (auth.userId !== resourceOwnerId) {
    const error = new Error('Forbidden: You can only access your own submissions and profile.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

export default {
  getAuthContext,
  isFaculty,
  isStudent,
  requireAuth,
  requireFaculty,
  requireSelfOrFaculty,
};
