import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

// Student Pages
import StudentOverview from '../pages/student/StudentOverview';
import MyAssignments from '../pages/student/MyAssignments';
import AssignmentDetails from '../pages/student/AssignmentDetails';
import SubmitAssignment from '../pages/student/SubmitAssignment';
import MySubmissions from '../pages/student/MySubmissions';
import StudentProfile from '../pages/student/StudentProfile';

// Admin / Faculty Pages
import AdminOverview from '../pages/admin/AdminOverview';
import ManageAssignments from '../pages/admin/ManageAssignments';
import CreateAssignment from '../pages/admin/CreateAssignment';
import EditAssignment from '../pages/admin/EditAssignment';
import ManageStudents from '../pages/admin/ManageStudents';
import ViewSubmissions from '../pages/admin/ViewSubmissions';
import SubmissionDetails from '../pages/admin/SubmissionDetails';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentOverview />} />
          <Route path="/student/assignments" element={<MyAssignments />} />
          <Route path="/student/assignments/:id" element={<AssignmentDetails />} />
          <Route path="/student/assignments/:id/submit" element={<SubmitAssignment />} />
          <Route path="/student/submissions" element={<MySubmissions />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Route>

      {/* Faculty / Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/assignments" element={<ManageAssignments />} />
          <Route path="/admin/assignments/create" element={<CreateAssignment />} />
          <Route path="/admin/assignments/:id/edit" element={<EditAssignment />} />
          <Route path="/admin/students" element={<ManageStudents />} />
          <Route path="/admin/submissions" element={<ViewSubmissions />} />
          <Route path="/admin/submissions/:id" element={<SubmissionDetails />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
