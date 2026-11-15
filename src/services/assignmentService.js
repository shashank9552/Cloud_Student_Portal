import storageService from './storageService';
import { simulateDelay } from './apiClient';

export const assignmentService = {
  // Get all assignments with optional filters
  getAssignments: async (filters = {}) => {
    await simulateDelay(300);
    let assignments = storageService.getAssignments();

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
    await simulateDelay(200);
    const assignments = storageService.getAssignments();
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }
    return assignment;
  },

  // Create new assignment (Faculty only)
  createAssignment: async (assignmentData) => {
    await simulateDelay(400);
    const assignments = storageService.getAssignments();

    const newAssignment = {
      id: `asn-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'Active',
      allowLateSubmissions: false,
      instructions: [
        'Read all requirements thoroughly before starting.',
        'Ensure diagrams and architectures conform to modern best practices.',
        'Submit in single PDF format (Max 10MB).'
      ],
      ...assignmentData,
    };

    const updated = [newAssignment, ...assignments];
    storageService.setAssignments(updated);

    // Log activity
    storageService.addActivity({
      title: 'New Assignment Published',
      description: `"${newAssignment.title}" for course ${newAssignment.code} is now live.`,
      type: 'assignment',
      status: 'info'
    });

    return newAssignment;
  },

  // Update existing assignment
  updateAssignment: async (id, updateData) => {
    await simulateDelay(350);
    const assignments = storageService.getAssignments();
    const index = assignments.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }

    const updatedAssignment = {
      ...assignments[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    assignments[index] = updatedAssignment;
    storageService.setAssignments(assignments);

    return updatedAssignment;
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    await simulateDelay(300);
    const assignments = storageService.getAssignments();
    const filtered = assignments.filter((a) => a.id !== id);
    storageService.setAssignments(filtered);
    return { success: true, id };
  },

  // Get aggregate statistics for dashboard
  getAssignmentStats: async () => {
    await simulateDelay(150);
    const assignments = storageService.getAssignments();
    const submissions = storageService.getSubmissions();

    const total = assignments.length;
    const active = assignments.filter((a) => a.status === 'Active').length;
    const closed = assignments.filter((a) => a.status === 'Closed').length;

    return {
      total,
      active,
      closed,
      totalSubmissions: submissions.length,
    };
  }
};

export default assignmentService;
