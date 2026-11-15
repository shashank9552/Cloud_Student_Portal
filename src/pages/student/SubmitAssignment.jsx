import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import Dropzone from '../../components/common/Dropzone';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatFileSize, formatDateTime } from '../../utils/formatters';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldAlert,
  Server
} from 'lucide-react';

export const SubmitAssignment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const asn = await assignmentService.getAssignmentById(id);
        setAssignment(asn);
      } catch (err) {
        toast.error('Failed to find assignment');
        navigate('/student/assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id, navigate, toast]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please attach your PDF report before proceeding.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: Request private S3 presigned PUT URL from API Gateway / Lambda
      const uploadData = await submissionService.getPresignedUploadUrl(
        assignment.id || assignment.assignmentId,
        selectedFile.name,
        'application/pdf'
      );

      // Step 2: Directly upload PDF bytes from browser to Amazon S3
      await submissionService.uploadFileToS3(uploadData.uploadUrl, selectedFile);

      // Step 3: Record metadata and S3 object key in Amazon DynamoDB
      await submissionService.submitAssignment({
        assignmentId: assignment.id || assignment.assignmentId,
        assignmentTitle: assignment.title,
        courseCode: assignment.code || assignment.courseCode,
        studentId: user?.id,
        studentName: user?.name,
        studentRoll: user?.rollNumber || 'MCA2024042',
        studentEmail: user?.email,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        s3FileKey: uploadData.fileKey,
        remarks: remarks,
        maxMarks: assignment.totalMarks || assignment.maxMarks,
      });

      setShowConfirmModal(false);
      toast.success('Assignment PDF securely uploaded to S3 and submitted successfully!');
      navigate('/student/submissions');
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Preparing submission portal..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Submit Assignment Solution"
        subtitle={`Upload your final PDF report for ${assignment?.code}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Assignments', href: '/student/assignments' },
          { label: assignment?.code, href: `/student/assignments/${assignment?.id}` },
          { label: 'Submit' },
        ]}
        action={
          <Link to={`/student/assignments/${assignment?.id}`}>
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Details
            </Button>
          </Link>
        }
      />

      {/* Assignment Summary Banner */}
      <Card padding="p-5" className="bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                {assignment?.code}
              </span>
              <span className="text-xs text-slate-300">Max Marks: {assignment?.totalMarks}</span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">{assignment?.title}</h3>
          </div>
          <div className="text-xs text-slate-400 sm:text-right shrink-0">
            <span className="block text-slate-300 font-semibold">Deadline:</span>
            <span>{formatDateTime(assignment?.deadline)}</span>
          </div>
        </div>
      </Card>

      {/* Main Submission Form */}
      <form onSubmit={handleFormSubmit}>
        <Card padding="p-6" className="space-y-6">
          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Assignment Document (PDF Required) <span className="text-rose-500">*</span>
            </label>
            <Dropzone
              selectedFile={selectedFile}
              onFileSelect={(file) => setSelectedFile(file)}
              onClear={() => setSelectedFile(null)}
              maxSizeMB={10}
            />
          </div>

          {/* Student Remarks / Notes */}
          <div>
            <Textarea
              label="Student Remarks / Notes (Optional)"
              rows={4}
              placeholder="Add any specific comments, references, GitHub repository URLs, or notes for the faculty reviewer..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              helperText="Optional context to help the faculty evaluator understand your architecture and findings."
            />
          </div>

          {/* Cloud Storage Notice */}
          <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 flex items-start gap-3 text-xs text-brand-900">
            <Server className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">AWS S3 Cloud Upload Simulation:</span> Upon confirmation,
              your document is assigned an S3 presigned URL, securely stored in the submission bucket,
              and recorded as a pending item in Amazon DynamoDB.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to={`/student/assignments/${assignment?.id}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile}
              icon={UploadCloud}
            >
              Submit Assignment PDF
            </Button>
          </div>
        </Card>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Submission"
        subtitle="Please review your submission details before uploading"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Back to Edit
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleFinalSubmit}
              icon={CheckCircle2}
            >
              Confirm & Upload to S3
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div>
              <span className="text-slate-400 block">Course & Assignment:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {assignment?.code} - {assignment?.title}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Attached File:</span>
              <span className="font-medium text-brand-700 flex items-center gap-1.5 mt-0.5">
                <FileText className="w-4 h-4 text-rose-500" />
                {selectedFile?.name} ({formatFileSize(selectedFile?.size)})
              </span>
            </div>
            {remarks && (
              <div>
                <span className="text-slate-400 block">Remarks:</span>
                <span className="text-slate-700 italic">"{remarks}"</span>
              </div>
            )}
          </div>

          <p className="text-slate-500 leading-relaxed">
            By confirming, your submission will be time-stamped and queued for faculty review.
            You can view your submission status anytime in the Submissions dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default SubmitAssignment;
