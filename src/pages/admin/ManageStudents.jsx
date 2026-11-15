import React, { useState, useEffect } from 'react';
import studentService from '../../services/studentService';
import submissionService from '../../services/submissionService';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  Users,
  Search,
  Eye,
  Mail,
  Award,
  BookOpen,
  FileCheck2,
  Calendar
} from 'lucide-react';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('All');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getStudents({ search, semester: semesterFilter });
        setStudents(data);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [search, semesterFilter]);

  const viewStudentDetails = async (student) => {
    setSelectedStudent(student);
    try {
      const subs = await submissionService.getSubmissionsByStudent(student.id);
      setStudentSubmissions(subs);
    } catch {
      setStudentSubmissions([]);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrolled Student Directory"
        subtitle="View registered students, academic standing, roll numbers and coursework submission rates"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Manage Students' },
        ]}
      />

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search student by name, roll no or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Semesters' },
              { value: 'Semester 1', label: 'Semester 1' },
              { value: 'Semester 2', label: 'Semester 2' },
              { value: 'Semester 3', label: 'Semester 3' },
              { value: 'Semester 4', label: 'Semester 4' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Loader text="Fetching student records..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="No students matched your search criteria."
          actionText="Clear Search"
          onAction={() => {
            setSearch('');
            setSemesterFilter('All');
          }}
        />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Student Information</th>
                  <th className="py-3.5 px-4">University Roll No</th>
                  <th className="py-3.5 px-4">Program & Semester</th>
                  <th className="py-3.5 px-4">Submissions</th>
                  <th className="py-3.5 px-4">GPA</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{student.name}</p>
                          <p className="text-[11px] text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-[11px]">
                        {student.rollNumber}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                      <div>
                        <p className="font-medium text-slate-800">{student.department}</p>
                        <p className="text-[10px] text-slate-400">{student.semester}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <FileCheck2 className="w-3.5 h-3.5 text-brand-600" />
                        {student.submissionsCount} Uploaded
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-800">
                      {student.gpa || 'N/A'}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={student.status === 'Active' ? 'success' : 'warning'}
                        size="sm"
                        showDot={true}
                      >
                        {student.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => viewStudentDetails(student)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Student Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Student Academic Dossier"
        subtitle={selectedStudent?.name}
        footer={
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-200 shrink-0"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedStudent.name}</h4>
                <p className="text-xs font-semibold text-brand-600 font-mono mt-0.5">
                  Roll: {selectedStudent.rollNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Cumulative GPA</span>
                <span className="text-base font-black text-slate-800">{selectedStudent.gpa}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Total Submissions</span>
                <span className="text-base font-black text-brand-600">
                  {selectedStudent.submissionsCount} Files
                </span>
              </div>
            </div>

            {/* Submissions List */}
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Student Coursework History
              </h5>
              {studentSubmissions.length === 0 ? (
                <p className="text-slate-400 italic py-2">No submission records on file.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {studentSubmissions.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-[11px]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-brand-700">{s.courseCode}: </span>
                        <span className="text-slate-800 font-medium truncate">{s.assignmentTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge status={s.status} size="sm" />
                        {s.grade !== null && (
                          <span className="font-bold text-emerald-600">
                            {s.grade}/{s.maxMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageStudents;
