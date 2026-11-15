import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  Save,
  ArrowLeft,
  Calendar,
  Award,
  FileText,
  AlertCircle
} from 'lucide-react';

export const EditAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const asn = await assignmentService.getAssignmentById(id);
        setFormData({
          ...asn,
          deadline: asn.deadline ? asn.deadline.slice(0, 16) : '',
          instructionsText: Array.isArray(asn.instructions) ? asn.instructions.join('\n') : '',
        });
      } catch (err) {
        toast.error('Assignment not found');
        navigate('/admin/assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide an assignment title.');
      return;
    }

    setSaving(true);
    try {
      const instructionsArray = formData.instructionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await assignmentService.updateAssignment(id, {
        title: formData.title,
        status: formData.status,
        totalMarks: Number(formData.totalMarks),
        deadline: new Date(formData.deadline).toISOString(),
        description: formData.description,
        instructions: instructionsArray,
        allowLateSubmissions: formData.allowLateSubmissions,
        fileAttachment: formData.fileAttachment || null,
      });

      toast.success('Assignment updated successfully!');
      navigate('/admin/assignments');
    } catch (err) {
      setError(err.message || 'Failed to update assignment');
      toast.error('Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader text="Loading assignment data..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Edit Assignment: ${formData?.code}`}
        subtitle="Modify deadline, problem criteria, total marks or status"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Manage Assignments', href: '/admin/assignments' },
          { label: 'Edit' },
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Assignment Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Select
                label="Lifecycle Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'Active', label: 'Active (Open for Submissions)' },
                  { value: 'Closed', label: 'Closed (Submissions Locked)' },
                ]}
              />
            </div>
          </div>

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
              label="Maximum Marks"
              type="number"
              icon={Award}
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Problem Statement & Description"
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <Textarea
            label="Submission Instructions (One per line)"
            rows={4}
            value={formData.instructionsText}
            onChange={(e) => setFormData({ ...formData, instructionsText: e.target.value })}
          />

          <Input
            label="Reference Attachment File Name (PDF)"
            placeholder="e.g. Specification_v2.pdf"
            icon={FileText}
            value={formData.fileAttachment || ''}
            onChange={(e) => setFormData({ ...formData, fileAttachment: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="lateSubEdit"
              checked={formData.allowLateSubmissions}
              onChange={(e) => setFormData({ ...formData, allowLateSubmissions: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="lateSubEdit" className="text-xs font-medium text-slate-700 cursor-pointer">
              Allow late submissions with penalty
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/admin/assignments">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving} icon={Save}>
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EditAssignment;
