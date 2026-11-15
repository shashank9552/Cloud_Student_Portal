import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import AssignmentFilters from '../../components/assignments/AssignmentFilters';
import { formatDateTime } from '../../utils/formatters';
import {
  PlusCircle,
  Edit3,
  Trash2,
  FileCheck2,
  FileText,
  AlertTriangle,
  Clock,
  Award
} from 'lucide-react';

export const ManageAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [asnList, subList] = await Promise.all([
        assignmentService.getAssignments({ search, status: statusFilter, course: courseFilter }),
        submissionService.getSubmissions()
      ]);
      setAssignments(asnList);
      setSubmissions(subList);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, courseFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await assignmentService.deleteAssignment(deleteId);
      toast.success('Assignment deleted successfully');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate submission counts for each assignment
  const subCountMap = {};
  submissions.forEach((s) => {
    subCountMap[s.assignmentId] = (subCountMap[s.assignmentId] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Assignments"
        subtitle="Create, edit, archive or track student submissions across curriculum courses"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Manage Assignments' },
        ]}
        action={
          <Link to="/admin/assignments/create">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              New Assignment
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <AssignmentFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseChange={setCourseFilter}
      />

      {loading ? (
        <Loader text="Fetching assignment records..." />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments found"
          description="Create your first assignment or adjust your filter query."
          actionText="Create New Assignment"
          onAction={() => window.location.assign('/admin/assignments/create')}
        />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Course & Assignment</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Marks</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submissions</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((asn) => {
                  const subCount = subCountMap[asn.id] || 0;

                  return (
                    <tr key={asn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 max-w-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                            {asn.code}
                          </span>
                          <span className="text-[11px] text-slate-400">{asn.courseName}</span>
                        </div>
                        <Link
                          to={`/admin/assignments/${asn.id}/edit`}
                          className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1 text-sm"
                        >
                          {asn.title}
                        </Link>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(asn.deadline)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-800">
                        {asn.totalMarks} Marks
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge status={asn.status} size="sm" showDot={true} />
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <Link
                          to={`/admin/submissions?assignmentId=${asn.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-brand-600" />
                          <span>{subCount} Submissions</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/assignments/${asn.id}/edit`}>
                            <Button variant="secondary" size="sm" icon={Edit3}>
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteId(asn.id)}
                            title="Delete"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Assignment"
        subtitle="This action will remove the assignment from the curriculum."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete} icon={Trash2}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Are you sure you want to permanently delete this assignment? Students will no longer be able
            to view or submit solutions for it.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ManageAssignments;
