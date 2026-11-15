import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

export const Dropzone = ({
  onFileSelect,
  selectedFile,
  onClear,
  maxSizeMB = 10,
  accept = '.pdf,application/pdf',
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndPass = (file) => {
    setValidationError('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setValidationError('Only PDF documents (.pdf) are accepted for submission.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setValidationError(`File size exceeds maximum allowed limit of ${maxSizeMB}MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
              : displayError
              ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-400'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-subtle mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Adobe PDF document only (Maximum file size: {maxSizeMB}MB)
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 font-medium">
            <span>Direct AWS S3 multipart upload simulation</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-brand-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)} • PDF Document ready for upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = '';
              onClear();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
