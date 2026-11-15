import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Calendar, Clock, Award, FileText, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { formatDateTime, getDaysRemaining } from '../../utils/formatters';

export const AssignmentCard = ({
  assignment,
  role = 'student',
  isSubmitted = false,
  submissionStatus = null,
  onDelete,
}) => {
  const deadlineInfo = getDaysRemaining(assignment.deadline);

  return (
    <Card hoverEffect={true} className="flex flex-col justify-between h-full">
      <div>
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md">
              {assignment.code}
            </span>
            <Badge status={assignment.status} size="sm" />
            {isSubmitted && (
              <Badge status={submissionStatus || 'Submitted'} size="sm" showDot={true}>
                {submissionStatus ? `Submission: ${submissionStatus}` : 'Submitted'}
              </Badge>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            {assignment.totalMarks} pts
          </span>
        </div>

        {/* Title & Description */}
        <Link
          to={role === 'faculty' ? `/admin/assignments/${assignment.id}/edit` : `/student/assignments/${assignment.id}`}
          className="group block"
        >
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            {assignment.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
          {assignment.description}
        </p>

        {/* Attachment Pill if present */}
        {assignment.fileAttachment && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium truncate max-w-full">
            <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{assignment.fileAttachment}</span>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Due {formatDateTime(assignment.deadline)}</span>
          </div>
          <span
            className={`font-medium ${
              deadlineInfo.isPast
                ? 'text-rose-600'
                : deadlineInfo.isUrgent
                ? 'text-amber-600'
                : 'text-slate-600'
            }`}
          >
            {deadlineInfo.label}
          </span>
        </div>

        {role === 'student' ? (
          <div className="flex items-center gap-2 pt-1">
            <Link to={`/student/assignments/${assignment.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
            {!isSubmitted ? (
              <Link to={`/student/assignments/${assignment.id}/submit`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full">
                  Submit PDF
                </Button>
              </Link>
            ) : (
              <Link to="/student/submissions" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  My Submission
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <Link to={`/admin/assignments/${assignment.id}/edit`} className="flex-1">
              <Button variant="secondary" size="sm" icon={Edit3} className="w-full">
                Edit
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => onDelete(assignment.id)}
                title="Delete assignment"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AssignmentCard;
