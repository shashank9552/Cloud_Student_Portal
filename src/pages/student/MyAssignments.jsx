import React, { useState, useEffect } from 'react';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import { useAuth } from '../../hooks/useAuth';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import AssignmentFilters from '../../components/assignments/AssignmentFilters';
import PageHeader from '../../components/common/PageHeader';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { BookOpen } from 'lucide-react';

export const MyAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [asnData, subData] = await Promise.all([
          assignmentService.getAssignments({ search, status: statusFilter, course: courseFilter }),
          submissionService.getSubmissionsByStudent(user?.id)
        ]);
        setAssignments(asnData);
        setSubmissions(subData);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, statusFilter, courseFilter, user?.id]);

  // Map of assignmentId -> submission object
  const submissionMap = new Map();
  submissions.forEach((s) => submissionMap.set(s.assignmentId, s));

  return (
    <div>
      <PageHeader
        title="Curriculum Assignments"
        subtitle="Explore active problem statements, submission requirements and project deadlines"
        breadcrumbs={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Assignments' },
        ]}
      />

      {/* Filter Component */}
      <AssignmentFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseChange={setCourseFilter}
      />

      {loading ? (
        <Loader text="Fetching assignments..." />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments found"
          description="Try clearing your search or changing the course and status filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('All');
            setCourseFilter('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const studentSub = submissionMap.get(assignment.id);
            return (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                role="student"
                isSubmitted={!!studentSub}
                submissionStatus={studentSub?.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAssignments;
