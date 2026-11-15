import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import StatCard from '../../components/dashboard/StatCard';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import RecentActivity from '../../components/dashboard/RecentActivity';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import SubmissionStatusBadge from '../../components/assignments/SubmissionStatusBadge';
import { formatDateTime } from '../../utils/formatters';

export const StudentOverview = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const overview = await studentService.getStudentDashboardOverview(user?.id);
        setData(overview);
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [user?.id]);

  if (loading) {
    return <Loader text="Loading your student dashboard..." />;
  }

  const { stats, upcomingDeadlines, recentSubmissions, recentActivities } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Semester 4 • 2025-2026 Academic Session
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-brand-100 text-sm mt-1 leading-relaxed">
            You have <strong className="text-white font-semibold">{stats?.pendingAssignmentsCount || 0} pending assignments</strong> requiring your attention before the upcoming deadlines.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/student/assignments">
              <Button
                variant="secondary"
                size="sm"
                icon={BookOpen}
                className="bg-white text-brand-700 hover:bg-brand-50 border-transparent shadow-sm"
              >
                Browse Assignments
              </Button>
            </Link>
            <Link to="/student/submissions">
              <Button
                variant="ghost"
                size="sm"
                icon={FileCheck2}
                className="text-white hover:bg-white/10"
              >
                View My Submissions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assignments"
          value={stats?.totalAssignments || 0}
          subtitle="Enrolled curriculum coursework"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Pending Submission"
          value={stats?.pendingAssignmentsCount || 0}
          subtitle="Action required soon"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Submitted Papers"
          value={stats?.submittedCount || 0}
          subtitle={`${stats?.approvedCount || 0} Approved, ${stats?.pendingReviewCount || 0} in review`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${stats?.averageScore || 0}%`}
          subtitle="Based on evaluated submissions"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Two Column Layout: Deadlines + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <UpcomingDeadlines assignments={upcomingDeadlines || []} />

          {/* Recent Submissions Table */}
          <Card padding="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Submissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your submitted PDF reports and evaluation progress</p>
              </div>
              <Link
                to="/student/submissions"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>All Submissions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {recentSubmissions?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No submissions yet.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Assignment</th>
                      <th className="pb-3">Course</th>
                      <th className="pb-3">Submitted</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSubmissions?.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-2 font-medium text-slate-900 max-w-xs truncate">
                          {sub.assignmentTitle}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {sub.courseCode}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{formatDateTime(sub.submittedAt)}</td>
                        <td className="py-3">
                          <SubmissionStatusBadge status={sub.status} size="sm" />
                        </td>
                        <td className="py-3 text-right pr-2 font-bold text-slate-900">
                          {sub.grade !== null ? (
                            <span className="text-emerald-600">
                              {sub.grade}/{sub.maxMarks}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Recent Activity Stream */}
        <div className="space-y-6">
          <RecentActivity activities={recentActivities || []} title="Assignment Activity" />
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
