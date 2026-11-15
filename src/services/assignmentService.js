import storageService from './storageService';
import apiClient, { simulateDelay, isBackendLive } from './apiClient';

/**
 * Normalizes assignment objects from DynamoDB or local storage
 * ensuring consistent field access across all dashboard views.
 */
const normalizeAssignment = (a) => {
  if (!a) return a;
  const id = a.assignmentId || a.id;
  const code = (a.courseCode || a.code || 'MCA-401').toUpperCase();
  const maxMarks = Number(a.maxMarks || a.totalMarks || 100);
  const guidelines = a.guidelines || a.instructions || [];

  return {
    ...a,
    assignmentId: id,
    id: id,
    courseCode: code,
    code: code,
    maxMarks,
    totalMarks: maxMarks,
    guidelines,
    instructions: guidelines,
  };
};

export const assignmentService = {
  // Get all assignments with optional filters
  getAssignments: async (filters = {}) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/assignments', {
          params: {
            status: filters.status && filters.status !== 'All' ? filters.status : undefined,
            courseCode: filters.course && filters.course !== 'All' ? filters.course : undefined,
          },
        });
        const items = response.data?.data || response.data || [];
        let assignments = items.map(normalizeAssignment);

        if (filters.search) {
          const q = filters.search.toLowerCase();
          assignments = assignments.filter(
            (a) =>
              a.title.toLowerCase().includes(q) ||
              a.code.toLowerCase().includes(q) ||
              a.description.toLowerCase().includes(q)
          );
        }

        return assignments;
      } catch (err) {
        console.warn('[assignmentService] API Gateway fetch failed, falling back to local storage:', err.message);
      }
    }

    // Local / Offline fallback
    await simulateDelay(300);
    let assignments = storageService.getAssignments().map(normalizeAssignment);

    if (filters.status && filters.status !== 'All') {
      assignments = assignments.filter((a) => a.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.course && filters.course !== 'All') {
      assignments = assignments.filter((a) => a.code === filters.course);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      assignments = assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    return assignments;
  },

  // Get single assignment by ID
  getAssignmentById: async (id) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get(`/assignments/${id}`);
        const item = response.data?.data || response.data;
        if (item) return normalizeAssignment(item);
      } catch (err) {
        console.warn(`[assignmentService] API fetch for ${id} failed, falling back:`, err.message);
      }
    }

    await simulateDelay(200);
    const assignments = storageService.getAssignments();
    const assignment = assignments.find((a) => a.assignmentId === id || a.id === id);
    if (!assignment) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }
    return normalizeAssignment(assignment);
  },

  // Query assignments by courseCode
  getAssignmentsByCourse: async (courseCode) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.get('/assignments', {
          params: { courseCode },
        });
        const items = response.data?.data || response.data || [];
        return items.map(normalizeAssignment);
      } catch (err) {
        console.warn(`[assignmentService] API course query for ${courseCode} failed, falling back:`, err.message);
      }
    }

    await simulateDelay(250);
    const assignments = storageService.getAssignments().map(normalizeAssignment);
    return assignments
      .filter((a) => a.code === courseCode.toUpperCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Create new assignment (Faculty only)
  createAssignment: async (assignmentData) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.post('/assignments', assignmentData);
        const created = response.data?.data || response.data;
        return normalizeAssignment(created);
      } catch (err) {
        console.warn('[assignmentService] API create failed, falling back to local storage:', err.message);
      }
    }

    await simulateDelay(400);
    const assignments = storageService.getAssignments();
    const now = new Date().toISOString();
    const generatedId = `asn-${Date.now().toString().slice(-4)}`;

    const newAssignment = normalizeAssignment({
      assignmentId: assignmentData.assignmentId || generatedId,
      id: assignmentData.assignmentId || generatedId,
      courseCode: assignmentData.courseCode || assignmentData.code || 'MCA-401',
      title: assignmentData.title,
      description: assignmentData.description,
      deadline: assignmentData.deadline,
      maxMarks: Number(assignmentData.maxMarks || assignmentData.totalMarks || 100),
      guidelines: assignmentData.guidelines || assignmentData.instructions || [],
      createdBy: assignmentData.createdBy || assignmentData.facultyId || 'usr-faculty-001',
      facultyName: assignmentData.facultyName || 'Dr. Radhika Sharma',
      status: assignmentData.status || 'Active',
      allowLateSubmissions: Boolean(assignmentData.allowLateSubmissions),
      fileAttachment: assignmentData.fileAttachment || null,
      createdAt: now,
      updatedAt: now,
    });

    const updated = [newAssignment, ...assignments];
    storageService.setAssignments(updated);

    storageService.addActivity({
      title: 'New Assignment Published',
      description: `"${newAssignment.title}" for course ${newAssignment.code} is now live.`,
      type: 'assignment',
      status: 'info',
    });

    return newAssignment;
  },

  // Update existing assignment
  updateAssignment: async (id, updateData) => {
    if (isBackendLive()) {
      try {
        const response = await apiClient.put(`/assignments/${id}`, updateData);
        const updated = response.data?.data || response.data;
        return normalizeAssignment(updated);
      } catch (err) {
        console.warn(`[assignmentService] API update for ${id} failed, falling back:`, err.message);
      }
    }

    await simulateDelay(350);
    const assignments = storageService.getAssignments();
    const index = assignments.findIndex((a) => a.assignmentId === id || a.id === id);

    if (index === -1) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }

    const updatedAssignment = normalizeAssignment({
      ...assignments[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    assignments[index] = updatedAssignment;
    storageService.setAssignments(assignments);

    return updatedAssignment;
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    if (isBackendLive()) {
      try {
        await apiClient.delete(`/assignments/${id}`);
        return { success: true, id };
      } catch (err) {
        console.warn(`[assignmentService] API delete for ${id} failed, falling back:`, err.message);
      }
    }

    await simulateDelay(300);
    const assignments = storageService.getAssignments();
    const filtered = assignments.filter((a) => a.assignmentId !== id && a.id !== id);
    storageService.setAssignments(filtered);
    return { success: true, id };
  },

  // Aggregate statistics
  getAssignmentStats: async () => {
    const assignments = await assignmentService.getAssignments();
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === 'Active').length;
    const closed = assignments.filter((a) => a.status === 'Closed').length;

    return {
      total,
      active,
      closed,
      totalSubmissions: 0,
    };
  },
};

export default assignmentService;
