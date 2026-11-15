import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

export const Badge = ({
  children,
  variant,
  status,
  size = 'md',
  showDot = false,
  className = '',
}) => {
  let styleClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (status) {
    const s = getStatusBadgeStyle(status);
    styleClass = s.bg;
    dotColor = s.dot;
  } else if (variant) {
    const variants = {
      primary: 'bg-brand-50 text-brand-700 border-brand-200',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-rose-50 text-rose-700 border-rose-200',
      info: 'bg-sky-50 text-sky-700 border-sky-200',
      neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    styleClass = variants[variant] || variants.neutral;
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styleClass} ${sizes[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children || (status ? getStatusBadgeStyle(status).label : '')}
    </span>
  );
};

export default Badge;
