import React from 'react';
import Badge from '../common/Badge';

export const SubmissionStatusBadge = ({ status, size = 'md' }) => {
  return <Badge status={status} size={size} showDot={true} />;
};

export default SubmissionStatusBadge;
