import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes as amplifyFetchUserAttributes,
  fetchAuthSession as amplifyFetchAuthSession,
} from 'aws-amplify/auth';
import { awsConfig, isCognitoConfigured } from './awsConfig';
import { initialUsers } from './mockData';
import { simulateDelay } from './apiClient';

/**
 * Format phone number to E.164 standard (+[country code][number]) if valid
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`; // Default to India (+91) for MCA context
  return `+${cleaned}`;
};

/**
 * Extract authenticated user profile and verified role from Cognito tokens
 */
const extractCognitoProfile = async (cognitoUser, authSession) => {
  const idToken = authSession.tokens?.idToken;
  const payload = idToken?.payload || {};

  // Retrieve user groups from verified JWT claims
  // AWS Cognito stores groups in 'cognito:groups' array in the ID token
  const groups = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups']
    : [];

  // Determine role strictly from Cognito User Pool Groups
  // Rule: Public signups never receive FACULTY privileges.
  // Only users explicitly assigned to FACULTY group by an AWS admin get faculty access.
  const isFaculty =
    groups.includes(awsConfig.cognito.groups.FACULTY) ||
    groups.includes('FacultyAdminGroup') ||
    groups.some((g) => g.toLowerCase() === 'faculty');

  const role = isFaculty ? 'faculty' : 'student';

  // Fetch Cognito user attributes
  let attributes = {};
  try {
    attributes = await amplifyFetchUserAttributes();
  } catch (e) {
    // Attributes might be partially available in ID token payload
    attributes = payload;
  }

  const name =
    attributes.name ||
    payload.name ||
    cognitoUser.username?.split('@')[0] ||
    'Authenticated User';

  const email = attributes.email || payload.email || cognitoUser.username;

  return {
    id: cognitoUser.userId || payload.sub,
    username: cognitoUser.username,
    name,
    email,
    role,
    groups,
    rollNumber:
      attributes['custom:roll_number'] ||
      payload['custom:roll_number'] ||
      (role === 'student' ? 'MCA2024042' : undefined),
    facultyId:
      attributes['custom:faculty_id'] ||
      payload['custom:faculty_id'] ||
      (role === 'faculty' ? 'FAC-CS-892' : undefined),
    department:
      attributes['custom:department'] ||
      payload['custom:department'] ||
      'Department of Computer Science & Engineering',
    semester:
      attributes['custom:semester'] ||
      payload['custom:semester'] ||
      'Semester 4',
    program: 'Master of Computer Applications (MCA)',
    academicYear: '2025-2026',
    avatar:
      role === 'faculty'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    enrolledCourses: [
      { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
      { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
      { code: 'MCA-403', name: 'Deep Learning & Neural Networks', credits: 3 },
      { code: 'MCA-404', name: 'Full-Stack Enterprise Systems', credits: 3 },
    ],
    contact: {
      phone: attributes.phone_number || payload.phone_number || '',
      address: 'Campus Hostel, Tech Campus',
    },
  };
};

export const authService = {
  /**
   * Check if real Amazon Cognito User Pool is configured
   */
  isConfigured: () => isCognitoConfigured,

  /**
   * Register a new Student Account in Amazon Cognito
   * Note: Public registration strictly creates a student account.
   */
  register: async (studentData) => {
    const {
      fullName,
      email,
      password,
      rollNumber,
      department,
      semester,
      phone,
    } = studentData;

    const normalizedEmail = email.trim().toLowerCase();

    if (isCognitoConfigured) {
      const userAttributes = {
        email: normalizedEmail,
        name: fullName.trim(),
      };

      const formattedPhone = formatPhoneNumber(phone);
      if (formattedPhone) {
        userAttributes.phone_number = formattedPhone;
      }

      // Add custom student attributes if supported by User Pool
      if (rollNumber) userAttributes['custom:roll_number'] = rollNumber.trim();
      if (department) userAttributes['custom:department'] = department.trim();
      if (semester) userAttributes['custom:semester'] = semester.trim();

      try {
        const { isSignUpComplete, userId, nextStep } = await amplifySignUp({
          username: normalizedEmail,
          password,
          options: {
            userAttributes,
          },
        });

        return {
          isSignUpComplete,
          userId,
          nextStep,
          email: normalizedEmail,
        };
      } catch (err) {
        // If User Pool doesn't have custom attributes provisioned yet, retry with standard attributes only
        if (
          err.name === 'InvalidParameterException' &&
          err.message?.includes('custom:')
        ) {
          const { isSignUpComplete, userId, nextStep } = await amplifySignUp({
            username: normalizedEmail,
            password,
            options: {
              userAttributes: {
                email: normalizedEmail,
                name: fullName.trim(),
              },
            },
          });
          return {
            isSignUpComplete,
            userId,
            nextStep,
            email: normalizedEmail,
          };
        }
        throw err;
      }
    } else {
      // Local development mock registration
      await simulateDelay(500);
      return {
        isSignUpComplete: false,
        userId: `mock-${Date.now()}`,
        nextStep: {
          signUpStep: 'CONFIRM_SIGN_UP',
          codeDeliveryDetails: {
            deliveryMedium: 'EMAIL',
            destination: normalizedEmail,
          },
        },
        email: normalizedEmail,
      };
    }
  },

  /**
   * Confirm Student Email with Cognito Verification Code
   */
  confirmRegistration: async (email, code) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isCognitoConfigured) {
      const { isSignUpComplete, nextStep } = await amplifyConfirmSignUp({
        username: normalizedEmail,
        confirmationCode: code.trim(),
      });
      return { isSignUpComplete, nextStep };
    } else {
      await simulateDelay(350);
      if (code.trim() !== '123456' && code.trim().length !== 6) {
        const err = new Error('Invalid verification code provided. For mock testing, use 123456.');
        err.name = 'CodeMismatchException';
        throw err;
      }
      return { isSignUpComplete: true };
    }
  },

  /**
   * Resend Cognito Email Verification Code
   */
  resendConfirmationCode: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isCognitoConfigured) {
      return await amplifyResendSignUpCode({
        username: normalizedEmail,
      });
    } else {
      await simulateDelay(300);
      return {
        deliveryMedium: 'EMAIL',
        destination: normalizedEmail,
      };
    }
  },

  /**
   * Login with Amazon Cognito User Pool
   */
  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isCognitoConfigured) {
      // Authenticate with Amazon Cognito
      const signInResult = await amplifySignIn({
        username: normalizedEmail,
        password,
      });

      if (!signInResult.isSignedIn) {
        if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          const err = new Error('Your email address has not been verified yet. Please enter your confirmation code.');
          err.name = 'UserNotConfirmedException';
          err.nextStep = signInResult.nextStep;
          throw err;
        }
        throw new Error(`Additional authentication step required: ${signInResult.nextStep?.signInStep}`);
      }

      // Fetch active session & token claims
      const cognitoUser = await amplifyGetCurrentUser();
      const authSession = await amplifyFetchAuthSession();

      return await extractCognitoProfile(cognitoUser, authSession);
    } else {
      // Local development mock login
      await simulateDelay(400);

      // Check if credentials match initial demo users
      const mockUser = initialUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (mockUser) {
        return {
          ...mockUser,
          groups: mockUser.role === 'faculty' ? ['FACULTY'] : ['STUDENT'],
        };
      }

      // Default mock student
      return {
        id: `mock-usr-${Date.now()}`,
        role: 'student',
        groups: ['STUDENT'],
        name: normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: normalizedEmail,
        rollNumber: 'MCA2024099',
        department: 'Department of Computer Science & Engineering',
        semester: 'Semester 4',
        program: 'Master of Computer Applications (MCA)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        enrolledCourses: [
          { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
          { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
        ],
      };
    }
  },

  /**
   * Sign out through Amplify Auth
   */
  logout: async () => {
    if (isCognitoConfigured) {
      try {
        await amplifySignOut({ global: false });
      } catch (err) {
        console.error('[AWS Cognito] SignOut error:', err);
      }
    }
    // Clear any local cache if needed
    localStorage.removeItem('cloudedu_current_user');
  },

  /**
   * Restore current session on browser refresh
   */
  getCurrentAuthenticatedUser: async () => {
    if (isCognitoConfigured) {
      try {
        const cognitoUser = await amplifyGetCurrentUser();
        const authSession = await amplifyFetchAuthSession();

        if (!authSession.tokens) {
          return null;
        }

        return await extractCognitoProfile(cognitoUser, authSession);
      } catch (err) {
        // Not authenticated or session expired
        return null;
      }
    } else {
      // Local mock restoration
      const cached = localStorage.getItem('cloudedu_current_user');
      return cached ? JSON.parse(cached) : initialUsers[0];
    }
  },

  /**
   * Retrieve active JWT Access/ID Token (without console logging secrets)
   */
  getAuthTokens: async () => {
    if (isCognitoConfigured) {
      try {
        const session = await amplifyFetchAuthSession();
        return {
          idToken: session.tokens?.idToken?.toString(),
          accessToken: session.tokens?.accessToken?.toString(),
        };
      } catch {
        return null;
      }
    }
    return { idToken: 'mock-id-token', accessToken: 'mock-access-token' };
  },
};

export default authService;
