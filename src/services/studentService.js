import storageService from './storageService';
import { simulateDelay } from './apiClient';

export const studentService = {
  // Get all registered students
  getStudents: async (filters = {}) => {
    await simulateDelay(250);
    let students = storageService.getStudents();

    if (filters.search) {
      const q = filters.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }

    if (filters.semester && filters.semester !== 'All') {
      students = students.filter((s) => s.semester === filters.semester);
    }

    return students;
  },

  // Get student by ID
  getStudentById: async (id) => {
    await simulateDelay(200);
    const students = storageService.getStudents();
    const student = students.find((s) => s.id === id);
    if (!student) {
      throw new Error(`Student with ID "${id}" not found.`);
    }
    return student;
  },

  // Compute student dashboard analytics
  getStudentDashboardOverview: async (studentId) => {
    await simulateDelay(250);
    const assignments = storageService.getAssignments();
    const submissions = storageService.getSubmissions();
    const activities = storageService.getActivities();

    const studentSubmissions = submissions.filter((s) => s.studentId === studentId);
    const submittedAssignmentIds = new Set(studentSubmissions.map((s) => s.assignmentId));

    // Active assignments not yet submitted
    const activeAssignments = assignments.filter((a) => a.status === 'Active');
    const pendingAssignments = activeAssignments.filter((a) => !submittedAssignmentIds.has(a.id));

    // Upcoming deadlines sorted by deadline
    const upcomingDeadlines = activeAssignments
      .filter((a) => new Date(a.deadline) >= new Date())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4)
      .map((a) => ({
        ...a,
        isSubmitted: submittedAssignmentIds.has(a.id),
      }));

    // Calculate completion / submission rate
    const totalAssignments = assignments.length;
    const submittedCount = studentSubmissions.length;
    const approvedCount = studentSubmissions.filter((s) => s.status === 'Approved').length;
    const pendingReviewCount = studentSubmissions.filter((s) => s.status === 'Pending').length;

    // Average grade on graded submissions
    const gradedSubmissions = studentSubmissions.filter((s) => s.grade !== null && s.grade !== undefined);
    const averageScore = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((acc, curr) => acc + (curr.grade / curr.maxMarks) * 100, 0) /
            gradedSubmissions.length
        )
      : 88; // Default mock average

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

  // Compute admin dashboard analytics
  getAdminDashboardOverview: async () => {
    await simulateDelay(250);
    const students = storageService.getStudents();
    const assignments = storageService.getAssignments();
    const submissions = storageService.getSubmissions();
    const activities = storageService.getActivities();

    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const pendingReviews = submissions.filter((s) => s.status === 'Pending').length;
    const reviewedCount = submissions.filter((s) => s.status === 'Reviewed' || s.status === 'Approved').length;

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
  }
};

export default studentService;
