import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import {
  Calendar,
  Clock,
  Award,
  FileText,
  User,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { formatDateTime, getDaysRemaining } from '../../utils/formatters';

export const AssignmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const asn = await assignmentService.getAssignmentById(id);
        setAssignment(asn);

        const subs = await submissionService.getSubmissionsByStudent(user?.id);
        const mySub = subs.find((s) => s.assignmentId === id);
        setSubmission(mySub || null);
      } catch (err) {
        console.error('Failed to load assignment details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user?.id]);

  if (loading) {
    return <Loader text="Loading assignment specifications..." />;
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Assignment Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested assignment ID does not exist.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/student/assignments')}>
          Return to Assignments
        </Button>
      </div>
    );
  }

  const deadlineInfo = getDaysRemaining(assignment.deadline);

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        subtitle={`${assignment.code} • ${assignment.courseName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Assignments', href: '/student/assignments' },
          { label: assignment.code },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Link to="/student/assignments">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Back to List
              </Button>
            </Link>
            {!submission ? (
              <Link to={`/student/assignments/${assignment.id}/submit`}>
                <Button variant="primary" size="sm" icon={UploadCloud}>
                  Submit Assignment
                </Button>
              </Link>
            ) : (
              <Link to={`/student/assignments/${assignment.id}/submit`}>
                <Button variant="secondary" size="sm" icon={UploadCloud}>
                  Re-Submit Solution
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Description Card */}
          <Card padding="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md">
                {assignment.code}
              </span>
              <Badge status={assignment.status} size="sm" />
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                Maximum Score: {assignment.totalMarks} Marks
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3">{assignment.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-6">
              {assignment.description}
            </p>

            {/* Structured Instructions */}
            {assignment.instructions && assignment.instructions.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Submission Instructions & Guidelines
                </h3>
                <ul className="space-y-2.5">
                  {assignment.instructions.map((inst, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-brand-200">
                        {index + 1}
                      </span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Faculty Attachment */}
            {assignment.fileAttachment && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {assignment.fileAttachment}
                    </p>
                    <p className="text-[11px] text-slate-500">Instructor Reference Material (PDF)</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() => alert(`Simulated download of ${assignment.fileAttachment}`)}
                >
                  Download PDF
                </Button>
              </div>
            )}
          </Card>

          {/* Student's Existing Submission Card (If submitted) */}
          {submission && (
            <Card padding="p-6" className="border-brand-200 bg-brand-50/20">
              <div className="flex items-center justify-between pb-4 border-b border-brand-100 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">Your Submission Record</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted on {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <SubmissionStatusBadge status={submission.status} size="lg" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {submission.fileName}
                      </p>
                      <p className="text-[11px] text-slate-500">File size: {submission.fileSize}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded">
                    Stored on Amazon S3
                  </span>
                </div>

                {submission.remarks && (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Remarks:
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{submission.remarks}</p>
                  </div>
                )}

                {/* Evaluation & Feedback Block */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Faculty Evaluation Score:
                    </span>
                    {submission.grade !== null ? (
                      <span className="text-base font-black text-emerald-600">
                        {submission.grade} / {submission.maxMarks} Marks
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Under Evaluation
                      </span>
                    )}
                  </div>

                  {submission.feedback ? (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                        <span>Faculty Feedback ({submission.reviewedBy}):</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        "{submission.feedback}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Faculty has not submitted remarks yet. Status is currently pending.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Information Card */}
        <div className="space-y-6">
          <Card padding="p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Assignment Meta
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Submission Deadline:</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(assignment.deadline)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                      deadlineInfo.isPast
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : deadlineInfo.isUrgent
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {deadlineInfo.label}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Instructor:</span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-800">{assignment.facultyName}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Max Marks:</span>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-900 text-sm">
                    {assignment.totalMarks} Points
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Late Submissions:</span>
                <span className="font-semibold text-slate-700">
                  {assignment.allowLateSubmissions ? 'Permitted (with penalty)' : 'Strictly Not Allowed'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to={`/student/assignments/${assignment.id}/submit`} className="w-full block">
                <Button variant="primary" className="w-full" icon={UploadCloud}>
                  {submission ? 'Update Submission' : 'Submit My Work'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetails;
