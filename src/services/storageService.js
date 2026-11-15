import {
  initialUsers,
  initialStudents,
  initialAssignments,
  initialSubmissions,
  initialActivities
} from './mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'cloudedu_current_user',
  ASSIGNMENTS: 'cloudedu_assignments',
  SUBMISSIONS: 'cloudedu_submissions',
  STUDENTS: 'cloudedu_students',
  ACTIVITIES: 'cloudedu_activities'
};

// Migrate stored record to DynamoDB schema alignment
const alignAssignmentSchema = (asn) => ({
  assignmentId: asn.assignmentId || asn.id,
  id: asn.id || asn.assignmentId,
  courseCode: asn.courseCode || asn.code,
  code: asn.code || asn.courseCode,
  courseName: asn.courseName || '',
  title: asn.title || '',
  description: asn.description || '',
  guidelines: asn.guidelines || asn.instructions || [],
  instructions: asn.instructions || asn.guidelines || [],
  deadline: asn.deadline,
  createdAt: asn.createdAt || new Date().toISOString(),
  updatedAt: asn.updatedAt || asn.createdAt || new Date().toISOString(),
  maxMarks: Number(asn.maxMarks || asn.totalMarks || 100),
  totalMarks: Number(asn.totalMarks || asn.maxMarks || 100),
  createdBy: asn.createdBy || asn.facultyId || 'usr-faculty-001',
  facultyId: asn.facultyId || asn.createdBy || 'usr-faculty-001',
  facultyName: asn.facultyName || 'Dr. Radhika Sharma',
  status: asn.status || 'Active',
  allowLateSubmissions: Boolean(asn.allowLateSubmissions),
  fileAttachment: asn.fileAttachment || null,
});

const alignSubmissionSchema = (sub) => {
  const assignmentId = sub.assignmentId;
  const submittedAt = sub.submittedAt || new Date().toISOString();
  const submissionKey = sub.submissionKey || `${assignmentId}#${submittedAt}`;

  return {
    submissionId: sub.submissionId || sub.id,
    id: sub.id || sub.submissionId,
    studentId: sub.studentId,
    assignmentId,
    submissionKey,
    assignmentTitle: sub.assignmentTitle,
    courseCode: sub.courseCode,
    studentName: sub.studentName,
    studentRoll: sub.studentRoll,
    studentEmail: sub.studentEmail,
    fileName: sub.fileName,
    s3FileKey: sub.s3FileKey || `submissions/${assignmentId}/${sub.studentId}/${sub.fileName}`,
    fileSize: sub.fileSize || '3.5 MB',
    submittedAt,
    status: sub.status || 'Pending',
    marks: sub.marks !== undefined ? sub.marks : sub.grade,
    grade: sub.grade !== undefined ? sub.grade : sub.marks,
    maxMarks: sub.maxMarks || 100,
    facultyFeedback: sub.facultyFeedback !== undefined ? sub.facultyFeedback : sub.feedback,
    feedback: sub.feedback !== undefined ? sub.feedback : sub.facultyFeedback,
    remarks: sub.remarks || '',
    reviewedAt: sub.reviewedAt || null,
    reviewedBy: sub.reviewedBy || null,
  };
};

// Initialize localStorage with mock data aligned with DynamoDB
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments.map(alignAssignmentSchema)));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions.map(alignSubmissionSchema)));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivities));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[0]));
  }
};

// Helper getter & setter with JSON safety
const getStored = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

// Storage APIs with DynamoDB Schema compatibility
export const storageService = {
  // Current logged in user
  getCurrentUser: () => getStored(STORAGE_KEYS.CURRENT_USER, initialUsers[0]),
  setCurrentUser: (user) => setStored(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),

  // Assignments
  getAssignments: () => {
    const raw = getStored(STORAGE_KEYS.ASSIGNMENTS, initialAssignments);
    return raw.map(alignAssignmentSchema);
  },
  setAssignments: (assignments) => setStored(STORAGE_KEYS.ASSIGNMENTS, assignments.map(alignAssignmentSchema)),
  
  // Submissions
  getSubmissions: () => {
    const raw = getStored(STORAGE_KEYS.SUBMISSIONS, initialSubmissions);
    return raw.map(alignSubmissionSchema);
  },
  setSubmissions: (submissions) => setStored(STORAGE_KEYS.SUBMISSIONS, submissions.map(alignSubmissionSchema)),

  // Students
  getStudents: () => getStored(STORAGE_KEYS.STUDENTS, initialStudents),
  setStudents: (students) => setStored(STORAGE_KEYS.STUDENTS, students),

  // Activities
  getActivities: () => getStored(STORAGE_KEYS.ACTIVITIES, initialActivities),
  addActivity: (activity) => {
    const activities = getStored(STORAGE_KEYS.ACTIVITIES, initialActivities);
    const updated = [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        status: 'info',
        ...activity
      },
      ...activities
    ].slice(0, 15);
    setStored(STORAGE_KEYS.ACTIVITIES, updated);
    return updated;
  },

  // Reset to initial mock factory settings
  resetToDefaults: () => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments.map(alignAssignmentSchema)));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions.map(alignSubmissionSchema)));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivities));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[0]));
  }
};

// Initialize immediately upon module load
initializeStorage();

export default storageService;
