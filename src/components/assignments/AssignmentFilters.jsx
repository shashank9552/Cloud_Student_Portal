import React from 'react';
import { Search, Filter } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';

export const AssignmentFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  courseFilter,
  onCourseChange,
  courses = [
    { value: 'All', label: 'All Courses' },
    { value: 'MCA-401', label: 'MCA-401: Cloud Computing & AWS' },
    { value: 'MCA-402', label: 'MCA-402: Distributed Systems' },
    { value: 'MCA-403', label: 'MCA-403: Deep Learning' },
    { value: 'MCA-404', label: 'MCA-404: Full-Stack Enterprise' },
  ],
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      {/* Search Input */}
      <div className="w-full md:w-80">
        <Input
          icon={Search}
          placeholder="Search assignments by title or code..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Selectors */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="w-full sm:w-48">
          <Select
            value={courseFilter}
            onChange={(e) => onCourseChange(e.target.value)}
            options={courses}
          />
        </div>

        <div className="w-full sm:w-40">
          <Select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active Only' },
              { value: 'Closed', label: 'Closed Only' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AssignmentFilters;
