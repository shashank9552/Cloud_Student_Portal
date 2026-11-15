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

// Initialize localStorage with mock data if not already present
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivities));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Default to student demo user for instant explore experience
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

// Storage APIs
export const storageService = {
  // Current logged in user
  getCurrentUser: () => getStored(STORAGE_KEYS.CURRENT_USER, initialUsers[0]),
  setCurrentUser: (user) => setStored(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),

  // Assignments
  getAssignments: () => getStored(STORAGE_KEYS.ASSIGNMENTS, initialAssignments),
  setAssignments: (assignments) => setStored(STORAGE_KEYS.ASSIGNMENTS, assignments),
  
  // Submissions
  getSubmissions: () => getStored(STORAGE_KEYS.SUBMISSIONS, initialSubmissions),
  setSubmissions: (submissions) => setStored(STORAGE_KEYS.SUBMISSIONS, submissions),

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
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(initialAssignments));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(initialSubmissions));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivities));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[0]));
  }
};

// Initialize immediately upon module load
initializeStorage();

export default storageService;
