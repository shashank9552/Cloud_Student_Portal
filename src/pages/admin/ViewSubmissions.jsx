import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import assignmentService from '../../services/assignmentService';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import { formatDateTime } from '../../utils/formatters';
import {
  FileCheck2,
  Search,
  Download,
  Eye,
  Award,
  Filter,
  FileText
} from 'lucide-react';

export const ViewSubmissions = () => {
  const [searchParams] = useSearchParams();
  const preselectedAssignmentId = searchParams.get('assignmentId') || 'All';

  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignmentFilter, setAssignmentFilter] = useState(preselectedAssignmentId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subList, asnList] = await Promise.all([
          submissionService.getSubmissions({
            search,
            status: statusFilter,
            assignmentId: assignmentFilter,
          }),
          assignmentService.getAssignments(),
        ]);
        setSubmissions(subList);
        setAssignments(asnList);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, statusFilter, assignmentFilter]);

  const handleDownload = (sub) => {
    alert(`Downloading "${sub.fileName}" via simulated AWS S3 presigned URL...`);
  };

  const assignmentOptions = [
    { value: 'All', label: 'All Assignments' },
    ...assignments.map((a) => ({ value: a.id, label: `${a.code}: ${a.title}` })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Submission Queue"
        subtitle="Review, download and grade student coursework submissions with four-stage lifecycle tracking"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Submissions' },
        ]}
      />

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <Input
            icon={Search}
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <Select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              options={assignmentOptions}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending Only' },
                { value: 'Reviewed', label: 'Reviewed Only' },
                { value: 'Approved', label: 'Approved Only' },
                { value: 'Rejected', label: 'Rejected Only' },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Fetching submission queue..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No submissions found"
          description="Try adjusting your filter options or selecting another assignment."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('All');
            setAssignmentFilter('All');
          }}
        />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Student Details</th>
                  <th className="py-3.5 px-4">Assignment / Course</th>
                  <th className="py-3.5 px-4">Uploaded File</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Review Status</th>
                  <th className="py-3.5 px-4">Evaluation</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">
                          {sub.studentName}
                        </p>
                        <p className="font-mono text-[11px] text-brand-600 mt-0.5">{sub.studentRoll}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <span className="font-bold text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded mr-1.5">
                        {sub.courseCode}
                      </span>
                      <span className="text-slate-800 font-medium line-clamp-1">
                        {sub.assignmentTitle}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[130px] font-medium">{sub.fileName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                      {formatDateTime(sub.submittedAt)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <SubmissionStatusBadge status={sub.status} size="sm" />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {sub.grade !== null ? (
                        <div className="flex items-center gap-1 font-extrabold text-emerald-600">
                          <Award className="w-4 h-4" />
                          <span>{sub.grade} / {sub.maxMarks}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not graded</span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownload(sub)}
                          title="Download PDF Document from S3"
                        >
                          S3 PDF
                        </Button>
                        <Link to={`/admin/submissions/${sub.id}`}>
                          <Button variant="secondary" size="sm" icon={Eye}>
                            Grade
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ViewSubmissions;
