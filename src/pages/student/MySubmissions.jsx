import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import { formatDateTime } from '../../utils/formatters';
import {
  FileCheck2,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const MySubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await submissionService.getSubmissionsByStudent(user?.id);
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [user?.id]);

  const openFeedback = (sub) => {
    setSelectedSubmission(sub);
    setIsFeedbackModalOpen(true);
  };

  const handleDownload = (sub) => {
    alert(`Simulating secure Amazon S3 download for "${sub.fileName}" via presigned URL.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Submission History"
        subtitle="Track submitted assignments, S3 file uploads, and faculty evaluation grades"
        breadcrumbs={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Submissions' },
        ]}
      />

      {loading ? (
        <Loader text="Loading your submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No Submissions Yet"
          description="You have not submitted any assignments so far. Head over to assignments to get started."
          actionText="Browse Assignments"
          onAction={() => window.location.assign('/student/assignments')}
        />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Assignment Details</th>
                  <th className="py-3.5 px-4">Uploaded File</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Review Status</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                          {sub.courseCode}
                        </span>
                      </div>
                      <Link
                        to={`/student/assignments/${sub.assignmentId}`}
                        className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1 text-sm"
                      >
                        {sub.assignmentTitle}
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="truncate max-w-[160px]">
                          <p className="font-medium text-slate-800 truncate">{sub.fileName}</p>
                          <p className="text-[10px] text-slate-400">{sub.fileSize}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
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
                          title="Download PDF"
                        >
                          PDF
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => openFeedback(sub)}
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Review & Feedback Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Submission Evaluation Details"
        subtitle={selectedSubmission?.assignmentTitle}
        footer={
          <Button variant="secondary" onClick={() => setIsFeedbackModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedSubmission && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Status:</span>
                <SubmissionStatusBadge status={selectedSubmission.status} size="md" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Awarded Score:</span>
                {selectedSubmission.grade !== null ? (
                  <span className="text-lg font-black text-emerald-600">
                    {selectedSubmission.grade} / {selectedSubmission.maxMarks} Marks
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">Pending Evaluation</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-slate-400 block">Uploaded Document:</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-slate-800">{selectedSubmission.fileName}</span>
                  <span className="text-slate-400">({selectedSubmission.fileSize})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={() => handleDownload(selectedSubmission)}
                >
                  Download
                </Button>
              </div>
            </div>

            {selectedSubmission.remarks && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-1">Your Submission Notes:</span>
                <p className="text-slate-700 italic">"{selectedSubmission.remarks}"</p>
              </div>
            )}

            <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Faculty Reviewer Comments:</span>
              </div>
              {selectedSubmission.feedback ? (
                <div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-brand-100">
                    "{selectedSubmission.feedback}"
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 text-right">
                    Reviewed by {selectedSubmission.reviewedBy} on{' '}
                    {formatDateTime(selectedSubmission.reviewedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Instructor has not finalized feedback yet. You will be notified once reviewed.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MySubmissions;
