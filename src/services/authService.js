import storageService from './storageService';
import { initialUsers } from './mockData';
import { simulateDelay } from './apiClient';

export const authService = {
  // Login with credentials
  login: async (email, password, role = 'student') => {
    await simulateDelay(400);

    // Check credentials against mock pool
    let user = initialUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Allow dynamic student login if registered
      user = {
        id: `usr-${role}-${Date.now()}`,
        role: role,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: email,
        avatar: role === 'faculty' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rollNumber: role === 'student' ? 'MCA2024099' : undefined,
        facultyId: role === 'faculty' ? 'FAC-CS-101' : undefined,
        department: 'Department of Computer Science & Engineering',
        semester: 'Semester 4',
        program: 'Master of Computer Applications (MCA)',
        enrolledCourses: [
          { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
          { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
          { code: 'MCA-403', name: 'Deep Learning & Neural Networks', credits: 3 },
          { code: 'MCA-404', name: 'Full-Stack Enterprise Systems', credits: 3 }
        ]
      };
    }

    // Attach mock JWT token representing future Cognito token
    const authenticatedUser = {
      ...user,
      token: `mock-cognito-jwt-token-${Date.now()}`
    };

    storageService.setCurrentUser(authenticatedUser);
    return authenticatedUser;
  },

  // Register a new student
  register: async (studentData) => {
    await simulateDelay(500);

    const newUser = {
      id: `usr-student-${Date.now()}`,
      role: 'student',
      name: studentData.fullName,
      email: studentData.email,
      rollNumber: studentData.rollNumber,
      program: studentData.program || 'Master of Computer Applications (MCA)',
      department: studentData.department || 'Department of Computer Science & Engineering',
      semester: studentData.semester || 'Semester 4',
      academicYear: '2025-2026',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      enrolledCourses: [
        { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
        { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
        { code: 'MCA-403', name: 'Deep Learning & Neural Networks', credits: 3 },
        { code: 'MCA-404', name: 'Full-Stack Enterprise Systems', credits: 3 }
      ],
      contact: {
        phone: studentData.phone || '+91 99999 00000',
        address: 'Campus Hostel, Tech Campus'
      },
      token: `mock-cognito-jwt-token-${Date.now()}`
    };

    // Also add to student list
    const students = storageService.getStudents();
    const newStudentEntry = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      rollNumber: newUser.rollNumber,
      department: 'CSE / MCA',
      semester: newUser.semester,
      submissionsCount: 0,
      status: 'Active',
      avatar: newUser.avatar,
      gpa: 'N/A'
    };
    storageService.setStudents([newStudentEntry, ...students]);
    storageService.setCurrentUser(newUser);

    return newUser;
  },

  // Logout
  logout: async () => {
    await simulateDelay(200);
    storageService.clearCurrentUser();
  },

  // Get current session
  getCurrentUser: () => {
    return storageService.getCurrentUser();
  },

  // Update profile
  updateProfile: async (updatedData) => {
    await simulateDelay(350);
    const current = storageService.getCurrentUser();
    const updated = {
      ...current,
      ...updatedData
    };
    storageService.setCurrentUser(updated);
    return updated;
  },

  // Quick switch role for testing & demo presentation
  switchRole: (role) => {
    const targetUser = initialUsers.find((u) => u.role === role) || initialUsers[0];
    storageService.setCurrentUser(targetUser);
    return targetUser;
  }
};

export default authService;
