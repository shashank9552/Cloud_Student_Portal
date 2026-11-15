/**
 * User & Student Profile Handlers
 */
import userRepository from '../repositories/userRepository.js';
import { getAuthContext, requireAuth, requireFaculty } from '../utils/authContext.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const userHandler = {
  /**
   * GET /api/users/profile
   * Retrieves the current user's profile from DynamoDB.
   * If the DynamoDB profile does not exist yet (e.g. freshly verified Cognito user),
   * synthesizes and stores the baseline profile from verified Cognito claims.
   */
  getProfile: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      let profile = await userRepository.getUserById(auth.userId);

      // Auto-provision user record in DynamoDB if not present
      if (!profile) {
        profile = await userRepository.createUser({
          userId: auth.userId,
          name: auth.name || (auth.role === 'faculty' ? 'Faculty Member' : 'Student User'),
          email: auth.email,
          rollNumber: auth.rollNumber || (auth.role === 'faculty' ? 'FAC-001' : 'ROLL-AUTO'),
          role: auth.role,
        });
      }

      return successResponse(profile);
    } catch (err) {
      console.error('[userHandler.getProfile] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * PUT /api/users/profile
   * Updates allowed profile attributes (name, phone, department, semester).
   * Note: Role and email cannot be updated by the client.
   */
  updateProfile: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const updated = await userRepository.updateUserProfile(auth.userId, body);

      return successResponse(updated, 200, 'Profile updated successfully.');
    } catch (err) {
      console.error('[userHandler.updateProfile] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/users/students
   * List all registered students (Faculty only)
   */
  listStudents: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireFaculty(auth);

      const students = await userRepository.listStudents();
      return successResponse(students);
    } catch (err) {
      console.error('[userHandler.listStudents] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },
};

export default userHandler;
