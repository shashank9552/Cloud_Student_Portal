import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import assignmentService from '../../services/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import { formatDateTime } from '../../utils/formatters';
import {
  FileText,
  Download,
  User,
  Award,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
  Server
} from 'lucide-react';

export const SubmissionDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for grading
  const [status, setStatus] = useState('Reviewed');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const sub = await submissionService.getSubmissionById(id);
        setSubmission(sub);
        setStatus(sub.status || 'Reviewed');
        setGrade(sub.grade !== null && sub.grade !== undefined ? sub.grade.toString() : '');
        setFeedback(sub.feedback || '');

        const asn = await assignmentService.getAssignmentById(sub.assignmentId);
        setAssignment(asn);
      } catch (err) {
        toast.error('Failed to load submission');
        navigate('/admin/submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate, toast]);

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await submissionService.updateSubmissionStatus(id, {
        status,
        grade: grade !== '' ? Number(grade) : null,
        feedback,
        reviewedBy: user?.name || 'Dr. Radhika Sharma',
      });
      setSubmission(updated);
      toast.success(`Submission status updated to "${status}" successfully!`);
    } catch (err) {
      toast.error('Failed to update submission evaluation');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const downloadUrl = await submissionService.getPresignedDownloadUrl({
        submissionId: submission?.submissionId || submission?.id,
        fileKey: submission?.s3FileKey,
        filename: submission?.fileName,
      });
      window.open(downloadUrl, '_blank');
      toast.success(`Opening S3 secure download for "${submission?.fileName}"...`);
    } catch (err) {
      toast.error('Failed to generate secure S3 download URL');
    }
  };

  if (loading) {
    return <Loader text="Loading submission details and evaluation console..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Student Submission Evaluation"
        subtitle={`${submission?.courseCode} • ${submission?.assignmentTitle}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Submissions', href: '/admin/submissions' },
          { label: submission?.studentName },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/submissions">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Back to Queue
              </Button>
            </Link>
            <Button variant="primary" size="sm" icon={Download} onClick={handleDownload}>
              Download S3 PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student & Submission Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Overview Card */}
          <Card padding="p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-bold text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  {submission?.courseCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {submission?.assignmentTitle}
                </h3>
              </div>
              <SubmissionStatusBadge status={submission?.status} size="lg" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Student:</span>
                <span className="font-bold text-slate-800 text-sm">{submission?.studentName}</span>
                <span className="font-mono text-brand-600 block mt-0.5">{submission?.studentRoll}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Submitted At:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(submission?.submittedAt)}
                </span>
              </div>
            </div>

            {/* Attached PDF Preview Box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {submission?.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      File Size: {submission?.fileSize} • PDF Document
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={Download} onClick={handleDownload}>
                  Download
                </Button>
              </div>

              {/* Simulated PDF Preview Notice */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-500">
                <Server className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Simulated S3 URI: s3://cloudedu-portal-student-submissions/{submission?.s3Key}</span>
              </div>
            </div>

            {/* Student Remarks */}
            {submission?.remarks && (
              <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Notes & References:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                  "{submission.remarks}"
                </p>
              </div>
            )}
          </Card>

          {/* Assignment Guidelines & Problem Statement Context */}
          {assignment && (
            <Card padding="p-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rubric & Problem Requirements Reference:
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {assignment.description}
              </p>
              {assignment.instructions && (
                <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                  {assignment.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Faculty Grading & Evaluation Form */}
        <div>
          <Card padding="p-6">
            <CardHeader
              title="Grading & Review Panel"
              subtitle="Update lifecycle status and provide feedback"
            />

            <form onSubmit={handleSaveEvaluation} className="mt-5 space-y-4">
              {/* Submission Status Dropdown */}
              <div>
                <Select
                  label="Submission Review Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'Pending', label: 'Pending (Under Review)' },
                    { value: 'Reviewed', label: 'Reviewed (Evaluation Complete)' },
                    { value: 'Approved', label: 'Approved (Accepted & Passed)' },
                    { value: 'Rejected', label: 'Rejected (Resubmission Required)' },
                  ]}
                  required
                />
              </div>

              {/* Awarded Grade */}
              <div>
                <Input
                  label={`Awarded Score (Max ${submission?.maxMarks || 100})`}
                  type="number"
                  icon={Award}
                  placeholder={`0 - ${submission?.maxMarks || 100}`}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  min="0"
                  max={submission?.maxMarks || 100}
                />
              </div>

              {/* Faculty Feedback Comments */}
              <div>
                <Textarea
                  label="Faculty Review Feedback"
                  rows={6}
                  placeholder="Provide constructive feedback, highlight architectural strengths, or explain reasons for deductions/rejection..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  helperText="Visible to the student on their submissions dashboard and profile."
                />
              </div>

              {/* Save Action */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="w-full"
                  icon={Save}
                >
                  Save & Publish Evaluation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetails;
