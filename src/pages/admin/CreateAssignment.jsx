import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import {
  FilePlus,
  ArrowLeft,
  Calendar,
  Award,
  BookOpen,
  FileText,
  CheckCircle2
} from 'lucide-react';

export const CreateAssignment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    code: 'MCA-401',
    courseName: 'Cloud Computing & AWS Serverless',
    totalMarks: 100,
    deadline: '2026-12-15T23:59',
    description: '',
    instructions: '1. Document system architecture.\n2. Submit as single PDF document (Max 10MB).\n3. Adhere to academic integrity standards.',
    allowLateSubmissions: false,
    fileAttachment: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const courseOptions = [
    { value: 'MCA-401', label: 'MCA-401: Cloud Computing & AWS Serverless', name: 'Cloud Computing & AWS Serverless' },
    { value: 'MCA-402', label: 'MCA-402: Distributed Systems & NoSQL Databases', name: 'Distributed Systems & NoSQL Databases' },
    { value: 'MCA-403', label: 'MCA-403: Deep Learning & Neural Networks', name: 'Deep Learning & Neural Networks' },
    { value: 'MCA-404', label: 'MCA-404: Full-Stack Enterprise Systems', name: 'Full-Stack Enterprise Systems' },
  ];

  const handleCourseChange = (e) => {
    const selected = courseOptions.find((c) => c.value === e.target.value);
    setFormData({
      ...formData,
      code: selected.value,
      courseName: selected.name,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide an assignment title.');
      return;
    }

    if (!formData.deadline) {
      setError('Please set a valid submission deadline.');
      return;
    }

    setLoading(true);
    try {
      const instructionsArray = formData.instructions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await assignmentService.createAssignment({
        title: formData.title,
        code: formData.code,
        courseName: formData.courseName,
        totalMarks: Number(formData.totalMarks),
        deadline: new Date(formData.deadline).toISOString(),
        description: formData.description,
        instructions: instructionsArray,
        allowLateSubmissions: formData.allowLateSubmissions,
        fileAttachment: formData.fileAttachment ? formData.fileAttachment : null,
        facultyId: user?.id || 'usr-faculty-001',
        facultyName: user?.name || 'Dr. Radhika Sharma',
      });

      toast.success('Assignment created and published successfully!');
      navigate('/admin/assignments');
    } catch (err) {
      setError(err.message || 'Failed to create assignment');
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Create New Assignment"
        subtitle="Publish a new problem statement and submission guidelines for enrolled students"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Manage Assignments', href: '/admin/assignments' },
          { label: 'Create' },
        ]}
        action={
          <Link to="/admin/assignments">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to List
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card padding="p-6" className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <Input
            label="Assignment Title"
            placeholder="e.g. Serverless REST API Architecture using AWS Lambda"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {/* Course & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="Target Course"
                value={formData.code}
                onChange={handleCourseChange}
                options={courseOptions.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>
            <div>
              <Input
                label="Maximum Marks"
                type="number"
                icon={Award}
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Deadline & Late Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Submission Deadline"
              type="datetime-local"
              icon={Calendar}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
            <Input
              label="Reference Document (Optional PDF Name)"
              placeholder="e.g. Lab_Instruction_Rubric.pdf"
              icon={FileText}
              value={formData.fileAttachment}
              onChange={(e) => setFormData({ ...formData, fileAttachment: e.target.value })}
              helperText="Optional starter PDF document for students to download"
            />
          </div>

          {/* Description */}
          <Textarea
            label="Problem Statement & Scope Description"
            rows={5}
            placeholder="Provide a comprehensive technical description of the project requirements, architecture criteria, and deliverable specs..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          {/* Instructions */}
          <Textarea
            label="Evaluation Criteria & Instructions (One per line)"
            rows={4}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            helperText="Separate multiple instructions with line breaks. They will be formatted as a numbered checklist."
          />

          {/* Late submission checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="lateSub"
              checked={formData.allowLateSubmissions}
              onChange={(e) => setFormData({ ...formData, allowLateSubmissions: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="lateSub" className="text-xs font-medium text-slate-700 cursor-pointer">
              Allow late submissions with standard institutional penalty
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/admin/assignments">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading} icon={FilePlus}>
              Publish Assignment
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateAssignment;
