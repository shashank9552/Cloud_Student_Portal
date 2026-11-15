import storageService from './storageService';
import apiClient, { simulateDelay, isBackendLive } from './apiClient';
import assignmentService from './assignmentService';
import submissionService from './submissionService';

export const studentService = {
  // Get all registered students
  getStudents: async (filters = {}) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/users/students');
        let students = response.data?.data || response.data || [];

        if (filters.search) {
          const q = filters.search.toLowerCase();
          students = students.filter(
            (s) =>
              (s.name || '').toLowerCase().includes(q) ||
              (s.email || '').toLowerCase().includes(q) ||
              (s.rollNumber || '').toLowerCase().includes(q) ||
              (s.department || '').toLowerCase().includes(q)
          );
        }

        if (filters.semester && filters.semester !== 'All') {
          students = students.filter((s) => s.semester === filters.semester);
        }

        return students;
      } catch (err) {
        console.warn('[studentService] API students list failed, falling back:', err.message);
      }
    }

    await simulateDelay(250);
    let students = storageService.getStudents();

    if (filters.search) {
      const q = filters.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.rollNumber || '').toLowerCase().includes(q) ||
          (s.department || '').toLowerCase().includes(q)
      );
    }

    if (filters.semester && filters.semester !== 'All') {
      students = students.filter((s) => s.semester === filters.semester);
    }

    return students;
  },

  // Get student by ID (userId)
  getStudentById: async (id) => {
    const students = await studentService.getStudents();
    const student = students.find((s) => s.userId === id || s.id === id);
    if (!student) {
      throw new Error(`Student with ID "${id}" not found.`);
    }
    return student;
  },

  // Compute student dashboard analytics dynamically
  getStudentDashboardOverview: async (studentId) => {
    const [assignments, studentSubmissions] = await Promise.all([
      assignmentService.getAssignments(),
      submissionService.getSubmissionsByStudent(studentId),
    ]);

    const activities = storageService.getActivities();
    const submittedAssignmentIds = new Set(
      studentSubmissions.map((s) => s.assignmentId || s.id)
    );

    // Active assignments not yet submitted
    const activeAssignments = assignments.filter((a) => a.status === 'Active');
    const pendingAssignments = activeAssignments.filter(
      (a) => !submittedAssignmentIds.has(a.assignmentId || a.id)
    );

    // Upcoming deadlines sorted by deadline
    const upcomingDeadlines = activeAssignments
      .filter((a) => new Date(a.deadline) >= new Date())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4)
      .map((a) => ({
        ...a,
        isSubmitted: submittedAssignmentIds.has(a.assignmentId || a.id),
      }));

    // Calculate completion / submission rate
    const totalAssignments = assignments.length;
    const submittedCount = studentSubmissions.length;
    const approvedCount = studentSubmissions.filter((s) => s.status === 'Approved').length;
    const pendingReviewCount = studentSubmissions.filter((s) => s.status === 'Pending').length;

    // Average grade on graded submissions
    const gradedSubmissions = studentSubmissions.filter(
      (s) => (s.marks !== null && s.marks !== undefined) || (s.grade !== null && s.grade !== undefined)
    );
    const averageScore =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce(
              (acc, curr) =>
                acc + ((curr.marks !== null ? curr.marks : curr.grade) / (curr.maxMarks || 100)) * 100,
              0
            ) / gradedSubmissions.length
          )
        : 88;

    return {
      stats: {
        totalAssignments,
        submittedCount,
        pendingAssignmentsCount: pendingAssignments.length,
        approvedCount,
        pendingReviewCount,
        averageScore,
      },
      upcomingDeadlines,
      recentSubmissions: studentSubmissions.slice(0, 5),
      recentActivities: activities.slice(0, 5),
    };
  },

  // Compute admin dashboard analytics dynamically
  getAdminDashboardOverview: async () => {
    const [students, assignments, submissions] = await Promise.all([
      studentService.getStudents(),
      assignmentService.getAssignments(),
      submissionService.getSubmissions(),
    ]);

    const activities = storageService.getActivities();

    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const pendingReviews = submissions.filter((s) => s.status === 'Pending').length;
    const reviewedCount = submissions.filter(
      (s) => s.status === 'Reviewed' || s.status === 'Approved'
    ).length;

    return {
      stats: {
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingReviews,
        reviewedCount,
        activeAssignments: assignments.filter((a) => a.status === 'Active').length,
      },
      recentSubmissions: submissions.slice(0, 6),
      recentActivities: activities.slice(0, 6),
      recentAssignments: assignments.slice(0, 4),
    };
  },
};

export default studentService;
