import storageService from './storageService';
import { simulateDelay } from './apiClient';

export const submissionService = {
  // Get all submissions with optional filters (Admin/Faculty view)
  getSubmissions: async (filters = {}) => {
    await simulateDelay(300);
    let submissions = storageService.getSubmissions();

    if (filters.status && filters.status !== 'All') {
      submissions = submissions.filter((s) => s.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.assignmentId && filters.assignmentId !== 'All') {
      submissions = submissions.filter((s) => s.assignmentId === filters.assignmentId);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      submissions = submissions.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentRoll.toLowerCase().includes(q) ||
          s.assignmentTitle.toLowerCase().includes(q) ||
          s.courseCode.toLowerCase().includes(q)
      );
    }

    return submissions;
  },

  // Get submissions made by a specific student
  getSubmissionsByStudent: async (studentId) => {
    await simulateDelay(250);
    const submissions = storageService.getSubmissions();
    return submissions.filter((s) => s.studentId === studentId);
  },

  // Get single submission by ID
  getSubmissionById: async (id) => {
    await simulateDelay(200);
    const submissions = storageService.getSubmissions();
    const submission = submissions.find((s) => s.id === id);
    if (!submission) {
      throw new Error(`Submission with ID "${id}" not found.`);
    }
    return submission;
  },

  // Submit a new assignment (Student)
  submitAssignment: async (payload) => {
    await simulateDelay(600); // Simulate upload to S3 bucket
    const submissions = storageService.getSubmissions();

    // Check if previous submission exists for this student & assignment
    const existingIndex = submissions.findIndex(
      (s) => s.studentId === payload.studentId && s.assignmentId === payload.assignmentId
    );

    const newSubmission = {
      id: existingIndex >= 0 ? submissions[existingIndex].id : `sub-${Date.now().toString().slice(-4)}`,
      assignmentId: payload.assignmentId,
      assignmentTitle: payload.assignmentTitle,
      courseCode: payload.courseCode,
      studentId: payload.studentId,
      studentName: payload.studentName,
      studentRoll: payload.studentRoll,
      studentEmail: payload.studentEmail,
      fileName: payload.fileName || 'Assignment_Submission.pdf',
      fileSize: payload.fileSize || '3.5 MB',
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      grade: null,
      maxMarks: payload.maxMarks || 100,
      feedback: null,
      remarks: payload.remarks || '',
      reviewedAt: null,
      reviewedBy: null,
      // S3 simulated upload path
      s3Key: `submissions/${payload.assignmentId}/${payload.studentId}/${payload.fileName || 'submission.pdf'}`
    };

    let updatedSubmissions;
    if (existingIndex >= 0) {
      // Re-submit
      updatedSubmissions = [...submissions];
      updatedSubmissions[existingIndex] = newSubmission;
    } else {
      updatedSubmissions = [newSubmission, ...submissions];
    }

    storageService.setSubmissions(updatedSubmissions);

    // Update student submission count
    const students = storageService.getStudents();
    const studentIdx = students.findIndex((st) => st.id === payload.studentId);
    if (studentIdx >= 0) {
      students[studentIdx].submissionsCount = (students[studentIdx].submissionsCount || 0) + 1;
      storageService.setStudents(students);
    }

    // Add activity log
    storageService.addActivity({
      title: 'Assignment Submitted',
      description: `${payload.studentName} uploaded PDF for "${payload.assignmentTitle}"`,
      type: 'submission',
      status: 'info'
    });

    return newSubmission;
  },

  // Update submission review status and feedback (Faculty/Admin)
  updateSubmissionStatus: async (id, reviewData) => {
    await simulateDelay(350);
    const submissions = storageService.getSubmissions();
    const index = submissions.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Submission with ID "${id}" not found.`);
    }

    const updated = {
      ...submissions[index],
      status: reviewData.status || submissions[index].status,
      grade: reviewData.grade !== undefined ? Number(reviewData.grade) : submissions[index].grade,
      feedback: reviewData.feedback || submissions[index].feedback,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewData.reviewedBy || 'Faculty Admin'
    };

    submissions[index] = updated;
    storageService.setSubmissions(submissions);

    // Log activity
    storageService.addActivity({
      title: `Submission ${updated.status}`,
      description: `Evaluation updated for ${updated.studentName}'s "${updated.assignmentTitle}" (${updated.grade !== null ? `${updated.grade}/${updated.maxMarks}` : updated.status})`,
      type: updated.status === 'Approved' ? 'approved' : updated.status === 'Rejected' ? 'rejected' : 'grade',
      status: updated.status === 'Approved' ? 'success' : updated.status === 'Rejected' ? 'error' : 'info'
    });

    return updated;
  },

  // Get submission metrics
  getSubmissionMetrics: async () => {
    await simulateDelay(150);
    const submissions = storageService.getSubmissions();

    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'Pending').length;
    const reviewed = submissions.filter((s) => s.status === 'Reviewed').length;
    const approved = submissions.filter((s) => s.status === 'Approved').length;
    const rejected = submissions.filter((s) => s.status === 'Rejected').length;

    return {
      total,
      pending,
      reviewed,
      approved,
      rejected,
      reviewRate: total > 0 ? Math.round(((reviewed + approved) / total) * 100) : 0
    };
  }
};

export default submissionService;
