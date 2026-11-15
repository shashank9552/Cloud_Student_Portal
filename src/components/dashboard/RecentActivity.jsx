import React from 'react';
import { Card, CardHeader } from '../common/Card';
import { CheckCircle2, Clock, FileText, AlertCircle, ArrowUpRight } from 'lucide-react';

export const RecentActivity = ({ activities = [], title = 'Recent Activity' }) => {
  const getIcon = (type, status) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-4 h-4 text-brand-600" />;
      case 'approved':
      case 'grade':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'submission':
        return 'bg-brand-50 border-brand-100';
      case 'approved':
      case 'grade':
        return 'bg-emerald-50 border-emerald-100';
      case 'rejected':
        return 'bg-rose-50 border-rose-100';
      default:
        return 'bg-amber-50 border-amber-100';
    }
  };

  return (
    <Card padding="p-5">
      <CardHeader title={title} subtitle="Real-time event log powered by DynamoDB & CloudWatch" />
      <div className="mt-4 divide-y divide-slate-100">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recent activity recorded.</p>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${getBg(
                  item.type
                )}`}
              >
                {getIcon(item.type, item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 inline-block">{item.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
