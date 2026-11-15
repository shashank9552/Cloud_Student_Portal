import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  User,
  Mail,
  Hash,
  BookOpen,
  Award,
  Phone,
  MapPin,
  Github,
  Save,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const StudentProfile = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rollNumber: user?.rollNumber || 'MCA2024042',
    phone: user?.contact?.phone || '+91 98765 43210',
    address: user?.contact?.address || 'Tech Innovation Park, Campus Hostel B-302, Bengaluru',
    github: user?.contact?.github || 'https://github.com/cloud-student',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        contact: {
          phone: formData.phone,
          address: formData.address,
          github: formData.github,
        },
      });
      toast.success('Profile contact details updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const courses = user?.enrolledCourses || [
    { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
    { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
    { code: 'MCA-403', name: 'Deep Learning & Neural Networks', credits: 3 },
    { code: 'MCA-404', name: 'Full-Stack Enterprise Systems', credits: 3 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Student Profile & Academic Records"
        subtitle="Manage your identity credentials, enrolled courses, and contact information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/student' },
          { label: 'Profile' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Card */}
        <div className="space-y-6">
          <Card padding="p-6" className="text-center">
            <div className="relative inline-block mx-auto mb-4">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-brand-100 shadow-md mx-auto"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs font-semibold text-brand-600 mt-0.5">{user?.rollNumber}</p>
            <p className="text-xs text-slate-500 mt-1">{user?.program || 'MCA 4th Semester'}</p>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-xs text-slate-400">Current GPA</span>
                <span className="text-lg font-extrabold text-slate-800">8.92</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-xs text-slate-400">Submissions</span>
                <span className="text-lg font-extrabold text-brand-600">4 Done</span>
              </div>
            </div>
          </Card>

          {/* Academic Meta Card */}
          <Card padding="p-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Institutional Affiliation
            </h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">Department:</span>
                <span className="font-semibold text-slate-800">
                  {user?.department || 'Department of Computer Science & Engineering'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Academic Session:</span>
                <span className="font-semibold text-slate-800">2025-2026 (Semester 4)</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Amazon Cognito ID:</span>
                <span className="font-mono text-[11px] text-slate-500 truncate block">
                  {user?.id}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Contact & Enrolled Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Form */}
          <Card padding="p-6">
            <CardHeader
              title="Personal & Contact Information"
              subtitle="Update your student contact info stored in the cloud profile"
            />
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  icon={User}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="University Email"
                  icon={Mail}
                  value={formData.email}
                  disabled
                  helperText="Managed by institutional single sign-on"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="GitHub Portfolio URL"
                  icon={Github}
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                />
              </div>

              <Input
                label="Campus Residential Address"
                icon={MapPin}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="primary" loading={saving} icon={Save}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Enrolled Courses Card */}
          <Card padding="p-6">
            <CardHeader
              title="Enrolled Semester Courses"
              subtitle="Current curriculum syllabus courses eligible for assignment submissions"
            />
            <div className="mt-4 divide-y divide-slate-100">
              {courses.map((course) => (
                <div key={course.code} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md">
                      {course.code}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{course.name}</p>
                      <p className="text-xs text-slate-400">Department of Computer Science</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                    {course.credits} Credits
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
