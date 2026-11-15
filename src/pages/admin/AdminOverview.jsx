import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  FileCheck2,
  Clock,
  PlusCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import studentService from '../../services/studentService';
import StatCard from '../../components/dashboard/StatCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import { formatDateTime } from '../../utils/formatters';

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const overview = await studentService.getAdminDashboardOverview();
        setData(overview);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return <Loader text="Loading faculty administrative dashboard..." />;
  }

  const { stats, recentSubmissions, recentActivities, recentAssignments } = data || {};

  return (
    <div className="space-y-6">
      {/* Header with Quick Create CTA */}
      <PageHeader
        title="Faculty Management Console"
        subtitle="Department of Computer Science & Engineering • Cloud Computing & Distributed Systems"
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/assignments/create">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Create Assignment
              </Button>
            </Link>
            <Link to="/admin/submissions">
              <Button variant="secondary" size="sm" icon={FileCheck2}>
                Review Queue
              </Button>
            </Link>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled in active cohorts"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Assignments"
          value={stats?.activeAssignments || 0}
          subtitle={`Across ${stats?.totalAssignments || 0} total created`}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
          subtitle={`${stats?.reviewedCount || 0} reviewed & scored`}
          icon={FileCheck2}
          color="emerald"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          subtitle="Awaiting instructor feedback"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Main Grid: Submissions Queue & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Submissions Queue */}
          <Card padding="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incoming Student Submissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest PDF uploads pending review or evaluation
                </p>
              </div>
              <Link
                to="/admin/submissions"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All ({stats?.totalSubmissions})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Student</th>
                    <th className="pb-3">Assignment</th>
                    <th className="pb-3">Submitted</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSubmissions?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-2 font-medium text-slate-900">
                        <div>
                          <p className="font-semibold text-slate-900">{sub.studentName}</p>
                          <p className="text-[10px] text-slate-400">{sub.studentRoll}</p>
                        </div>
                      </td>
                      <td className="py-3.5 max-w-[200px]">
                        <span className="font-bold text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 mr-1.5">
                          {sub.courseCode}
                        </span>
                        <span className="text-slate-800 line-clamp-1">{sub.assignmentTitle}</span>
                      </td>
                      <td className="py-3.5 text-slate-500">{formatDateTime(sub.submittedAt)}</td>
                      <td className="py-3.5">
                        <SubmissionStatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <Link to={`/admin/submissions/${sub.id}`}>
                          <Button variant="secondary" size="sm">
                            {sub.status === 'Pending' ? 'Review & Grade' : 'View'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Active Assignments Overview */}
          <Card padding="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Course Assignments</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current problem statements published to students</p>
              </div>
              <Link
                to="/admin/assignments"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>Manage Assignments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentAssignments?.map((asn) => (
                <div
                  key={asn.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                        {asn.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {asn.totalMarks} Marks
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{asn.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{asn.description}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Deadline:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(asn.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Real-time Activity Stream */}
        <div className="space-y-6">
          <RecentActivity activities={recentActivities || []} title="System Activity Log" />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
