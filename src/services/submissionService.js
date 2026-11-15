import storageService from './storageService';
import apiClient, { simulateDelay, isBackendLive } from './apiClient';

/**
 * Normalizes submission records across DynamoDB and local storage
 */
const normalizeSubmission = (s) => {
  if (!s) return s;
  const id = s.submissionId || s.id;
  const marks = s.marks !== null && s.marks !== undefined ? Number(s.marks) : s.grade !== undefined ? Number(s.grade) : null;
  const feedback = s.facultyFeedback || s.feedback || null;

  return {
    ...s,
    submissionId: id,
    id: id,
    marks,
    grade: marks,
    facultyFeedback: feedback,
    feedback: feedback,
    fileSize: s.fileSize || '2.4 MB',
    status: s.status || 'Pending',
  };
};

export const submissionService = {
  /**
   * Request an S3 presigned upload URL from the backend
   * @param {string} assignmentId
   * @param {string} fileName
   * @param {string} [contentType='application/pdf']
   */
  getPresignedUploadUrl: async (assignmentId, fileName, contentType = 'application/pdf') => {
    if (isBackendLive()) {
      const response = await apiClient.post('/s3/upload-url', {
        assignmentId,
        fileName,
        contentType,
      });
      return response.data?.data || response.data;
    }

    // Mock upload URL response
    await simulateDelay(200);
    return {
      uploadUrl: 'https://cloudedu-mock-submissions.s3.ap-south-1.amazonaws.com/mock-upload',
      fileKey: `submissions/${assignmentId}/mock-student/${fileName}`,
      fileName,
      expiresIn: 900,
    };
  },

  /**
   * Upload binary file directly to S3 via presigned PUT URL
   * @param {string} presignedUrl
   * @param {File|Blob} file
   */
  uploadFileToS3: async (presignedUrl, file) => {
    if (isBackendLive() && presignedUrl && !presignedUrl.includes('mock-upload')) {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`S3 direct upload failed with status ${response.status}`);
      }
      return true;
    }

    // Mock direct upload simulation
    await simulateDelay(400);
    return true;
  },

  /**
   * Request a time-limited S3 presigned download URL
   * @param {Object} params
   * @param {string} [params.fileKey]
   * @param {string} [params.filename]
   * @param {string} [params.submissionId]
   */
  getPresignedDownloadUrl: async ({ fileKey, filename, submissionId }) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/s3/download-url', {
          params: { fileKey, filename, submissionId },
        });
        const data = response.data?.data || response.data;
        if (data?.downloadUrl) return data.downloadUrl;
      } catch (err) {
        console.warn('[submissionService] API presigned download URL error:', err.message);
      }
    }

    // Mock fallback: create a simple mock PDF blob URL
    const mockContent = `%PDF-1.4\n% Student Submission Document\nTitle: ${filename || 'Submission.pdf'}\nCloudEdu AWS Portal Demo`;
    const blob = new Blob([mockContent], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  // Get all submissions with optional filters (Admin/Faculty view)
  getSubmissions: async (filters = {}) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/submissions', {
          params: {
            status: filters.status && filters.status !== 'All' ? filters.status : undefined,
          },
        });
        const items = response.data?.data || response.data || [];
        let list = items.map(normalizeSubmission);

        if (filters.assignmentId && filters.assignmentId !== 'All') {
          list = list.filter((s) => s.assignmentId === filters.assignmentId);
        }

        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (s) =>
              (s.studentName || '').toLowerCase().includes(q) ||
              (s.studentRoll || '').toLowerCase().includes(q) ||
              (s.assignmentTitle || '').toLowerCase().includes(q) ||
              (s.courseCode || '').toLowerCase().includes(q)
          );
        }

        return list;
      } catch (err) {
        console.warn('[submissionService] API getSubmissions failed, falling back:', err.message);
      }
    }

    await simulateDelay(300);
    let submissions = storageService.getSubmissions().map(normalizeSubmission);

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

  // Get submissions made by the authenticated student
  getSubmissionsByStudent: async (studentId) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/submissions/my');
        const items = response.data?.data || response.data || [];
        return items.map(normalizeSubmission);
      } catch (err) {
        console.warn('[submissionService] API mySubmissions failed, falling back:', err.message);
      }
    }

    await simulateDelay(250);
    const submissions = storageService.getSubmissions().map(normalizeSubmission);
    return submissions.filter((s) => s.studentId === studentId);
  },

  // Get single submission by ID
  getSubmissionById: async (id) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get(`/submissions/${id}`);
        const item = response.data?.data || response.data;
        if (item) return normalizeSubmission(item);
      } catch (err) {
        console.warn(`[submissionService] API fetch for submission ${id} failed:`, err.message);
      }
    }

    await simulateDelay(200);
    const submissions = storageService.getSubmissions().map(normalizeSubmission);
    const submission = submissions.find(
      (s) => s.submissionId === id || s.id === id || s.submissionKey === id
    );
    if (!submission) {
      throw new Error(`Submission with identifier "${id}" not found.`);
    }
    return submission;
  },

  // Query submissions for an assignment
  getAssignmentSubmissions: async (assignmentId, status = null) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get(`/assignments/${assignmentId}/submissions`, {
          params: { status: status && status !== 'All' ? status : undefined },
        });
        const items = response.data?.data || response.data || [];
        return items.map(normalizeSubmission);
      } catch (err) {
        console.warn(`[submissionService] API assignment submissions failed for ${assignmentId}:`, err.message);
      }
    }

    await simulateDelay(250);
    let submissions = storageService
      .getSubmissions()
      .map(normalizeSubmission)
      .filter((s) => s.assignmentId === assignmentId);

    if (status && status !== 'All') {
      submissions = submissions.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }
    return submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },

  /**
   * Submit assignment solution (Student)
   */
  submitAssignment: async (payload) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.post('/submissions', {
          assignmentId: payload.assignmentId,
          fileName: payload.fileName,
          s3FileKey: payload.s3FileKey,
          remarks: payload.remarks,
          studentName: payload.studentName,
          studentRoll: payload.studentRoll,
        });
        const created = response.data?.data || response.data;
        return normalizeSubmission(created);
      } catch (err) {
        console.warn('[submissionService] API submit failed, falling back:', err.message);
      }
    }

    await simulateDelay(500);
    const submissions = storageService.getSubmissions();
    const submittedAt = new Date().toISOString();
    const submissionId = `sub-${Date.now().toString().slice(-4)}`;
    const submissionKey = `${payload.assignmentId}#${submittedAt}`;

    const newSubmission = normalizeSubmission({
      submissionId,
      id: submissionId,
      studentId: payload.studentId,
      assignmentId: payload.assignmentId,
      submissionKey,
      assignmentTitle: payload.assignmentTitle,
      courseCode: payload.courseCode,
      studentName: payload.studentName,
      studentRoll: payload.studentRoll,
      studentEmail: payload.studentEmail,
      fileName: payload.fileName || 'Assignment_Submission.pdf',
      fileSize: payload.fileSize || '3.5 MB',
      s3FileKey:
        payload.s3FileKey ||
        `submissions/${payload.assignmentId}/${payload.studentId}/${payload.fileName || 'submission.pdf'}`,
      submittedAt,
      status: 'Pending',
      marks: null,
      maxMarks: payload.maxMarks || 100,
      facultyFeedback: null,
      remarks: payload.remarks || '',
    });

    const updatedSubmissions = [newSubmission, ...submissions];
    storageService.setSubmissions(updatedSubmissions);

    const students = storageService.getStudents();
    const studentIdx = students.findIndex((st) => st.id === payload.studentId || st.userId === payload.studentId);
    if (studentIdx >= 0) {
      students[studentIdx].submissionsCount = (students[studentIdx].submissionsCount || 0) + 1;
      storageService.setStudents(students);
    }

    storageService.addActivity({
      title: 'Assignment Submitted',
      description: `${payload.studentName} uploaded PDF for "${payload.assignmentTitle}"`,
      type: 'submission',
      status: 'info',
    });

    return newSubmission;
  },

  // Update submission review status and feedback (Faculty/Admin)
  updateSubmissionStatus: async (id, reviewData) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.patch(`/submissions/${id}/review`, {
          status: reviewData.status,
          marks: reviewData.marks !== undefined ? Number(reviewData.marks) : Number(reviewData.grade),
          facultyFeedback: reviewData.facultyFeedback || reviewData.feedback,
          reviewedBy: reviewData.reviewedBy,
        });
        const updated = response.data?.data || response.data;
        return normalizeSubmission(updated);
      } catch (err) {
        console.warn(`[submissionService] API review for ${id} failed, falling back:`, err.message);
      }
    }

    await simulateDelay(350);
    const submissions = storageService.getSubmissions();
    const index = submissions.findIndex(
      (s) => s.submissionId === id || s.id === id || s.submissionKey === id
    );

    if (index === -1) {
      throw new Error(`Submission with identifier "${id}" not found.`);
    }

    const marksValue =
      reviewData.marks !== undefined
        ? Number(reviewData.marks)
        : reviewData.grade !== undefined
        ? Number(reviewData.grade)
        : submissions[index].marks;

    const feedbackValue =
      reviewData.facultyFeedback !== undefined
        ? reviewData.facultyFeedback
        : reviewData.feedback !== undefined
        ? reviewData.feedback
        : submissions[index].facultyFeedback;

    const updated = normalizeSubmission({
      ...submissions[index],
      status: reviewData.status || submissions[index].status,
      marks: marksValue,
      grade: marksValue,
      facultyFeedback: feedbackValue,
      feedback: feedbackValue,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewData.reviewedBy || 'Faculty Admin',
    });

    submissions[index] = updated;
    storageService.setSubmissions(submissions);

    storageService.addActivity({
      title: `Submission ${updated.status}`,
      description: `Evaluation updated for ${updated.studentName}'s "${updated.assignmentTitle}" (${updated.marks !== null ? `${updated.marks}/${updated.maxMarks}` : updated.status})`,
      type: updated.status === 'Approved' ? 'approved' : updated.status === 'Rejected' ? 'rejected' : 'grade',
      status: updated.status === 'Approved' ? 'success' : updated.status === 'Rejected' ? 'error' : 'info',
    });

    return updated;
  },

  // Get submission metrics
  getSubmissionMetrics: async () => {
    const submissions = await submissionService.getSubmissions();
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
      reviewRate: total > 0 ? Math.round(((reviewed + approved) / total) * 100) : 0,
    };
  },
};

export default submissionService;
