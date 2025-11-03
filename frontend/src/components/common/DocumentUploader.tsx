import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../ui';
import { Attachment } from '@/types';
import { format } from 'date-fns';

interface DocumentUploaderProps {
  attachments: Attachment[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete?: (id: string) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
}

export function DocumentUploader({
  attachments,
  onUpload,
  onDelete,
  maxFileSize = 10,
  allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png'],
  multiple = true
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return `File ${file.name} exceeds maximum size of ${maxFileSize}MB`;
      }

      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(extension)) {
        return `File type ${extension} is not allowed`;
      }
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validationError = validateFiles(fileArray);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      await onUpload(fileArray);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };

  return (
    <Card>
      <CardHeader
        title="Documents & Attachments"
        subtitle={`${attachments.length} file${attachments.length !== 1 ? 's' : ''}`}
      />

      <CardContent>
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={allowedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Click to upload
            </button>
            {' '}or drag and drop
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {allowedTypes.join(', ')} up to {maxFileSize}MB
          </p>

          {uploading && (
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {attachment.fileName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedBy}
                      {' • '}
                      {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={attachment.url}
                    download
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download
                  </a>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
