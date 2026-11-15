import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../common/Card';
import Badge from '../common/Badge';
import { Calendar, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatDateTime, getDaysRemaining } from '../../utils/formatters';

export const UpcomingDeadlines = ({ assignments = [] }) => {
  return (
    <Card padding="p-5">
      <CardHeader
        title="Upcoming Deadlines"
        subtitle="Assignments requiring submission before due date"
        action={
          <Link
            to="/student/assignments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />
      <div className="mt-4 space-y-3">
        {assignments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No active upcoming deadlines at this time.
          </div>
        ) : (
          assignments.map((asn) => {
            const deadlineInfo = getDaysRemaining(asn.deadline);

            return (
              <div
                key={asn.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all hover:shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                      {asn.code}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        deadlineInfo.isPast
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : deadlineInfo.isUrgent
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {deadlineInfo.label}
                    </span>
                    {asn.isSubmitted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Submitted
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{asn.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due {formatDateTime(asn.deadline)}
                    </span>
                    <span>•</span>
                    <span>Max Marks: {asn.totalMarks}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/student/assignments/${asn.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Details
                  </Link>
                  {!asn.isSubmitted && (
                    <Link
                      to={`/student/assignments/${asn.id}/submit`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                    >
                      Submit PDF
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default UpcomingDeadlines;
