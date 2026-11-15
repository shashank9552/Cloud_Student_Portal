/**
 * Formatting Utilities for Student Portal
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const getDaysRemaining = (deadlineString) => {
  if (!deadlineString) return { days: 0, label: 'No deadline', isPast: false, isUrgent: false };
  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
      isPast: true,
      isUrgent: true
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      label: 'Due today',
      isPast: false,
      isUrgent: true
    };
  } else if (diffDays === 1) {
    return {
      days: 1,
      label: 'Due tomorrow',
      isPast: false,
      isUrgent: true
    };
  } else {
    return {
      days: diffDays,
      label: `${diffDays} days left`,
      isPast: false,
      isUrgent: diffDays <= 3
    };
  }
};

export const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Approved'
      };
    case 'reviewed':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Reviewed'
      };
    case 'pending':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Pending'
      };
    case 'rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Rejected'
      };
    case 'active':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Active'
      };
    case 'closed':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Closed'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        label: status || 'Unknown'
      };
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (typeof bytes === 'string') return bytes;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
