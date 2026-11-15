/**
 * S3 Presigned URL Request Handlers
 * Generates secure, short-lived presigned URLs for client-side direct S3 upload and download.
 */
import { generatePresignedUploadUrl, generatePresignedDownloadUrl } from '../utils/s3Client.js';
import submissionRepository from '../repositories/submissionRepository.js';
import { getAuthContext, requireAuth, isFaculty } from '../utils/authContext.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const s3Handler = {
  /**
   * POST /api/s3/upload-url
   * Generates a presigned PUT URL for direct PDF upload to private S3 bucket.
   * Enforces PDF file type and organizes files by assignmentId and studentId.
   */
  getUploadUrl: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { assignmentId, fileName, contentType, fileSize } = body;

      if (!assignmentId || !fileName) {
        return errorResponse('assignmentId and fileName are required.', 400);
      }

      // Enforce 10 MB maximum upload size limit
      const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
      if (fileSize && Number(fileSize) > MAX_FILE_SIZE_BYTES) {
        return errorResponse('File size exceeds the 10 MB maximum allowed limit.', 400);
      }

      // PDF validation
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!sanitizedName.toLowerCase().endsWith('.pdf')) {
        return errorResponse('Only PDF files are permitted for assignment submissions.', 400);
      }

      const timestamp = Date.now();
      const s3Key = `submissions/${assignmentId}/${auth.userId}/${timestamp}-${sanitizedName}`;

      const urlData = await generatePresignedUploadUrl({
        key: s3Key,
        contentType: contentType || 'application/pdf',
      });

      return successResponse({
        uploadUrl: urlData.uploadUrl,
        fileKey: s3Key,
        fileName: sanitizedName,
        expiresIn: urlData.expiresIn,
      });
    } catch (err) {
      console.error('[s3Handler.getUploadUrl] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },

  /**
   * GET /api/s3/download-url
   * Generates a presigned GET URL for viewing or downloading a submitted PDF.
   * Enforces RBAC: Students can only download their own submissions; faculty can download any.
   */
  getDownloadUrl: async (event) => {
    try {
      const auth = getAuthContext(event);
      requireAuth(auth);

      const queryParams = event.queryStringParameters || {};
      const { fileKey, filename, submissionId } = queryParams;

      if (!fileKey && !submissionId) {
        return errorResponse('Either fileKey or submissionId is required.', 400);
      }

      let targetKey = fileKey;
      let originalFilename = filename;

      // If submissionId provided, verify student ownership or faculty privilege
      if (submissionId) {
        const submission = await submissionRepository.getSubmissionBySubmissionId(submissionId);
        if (!submission) {
          return errorResponse(`Submission '${submissionId}' not found.`, 404);
        }

        if (!isFaculty(auth) && submission.studentId !== auth.userId) {
          return errorResponse('Forbidden: You can only download your own submission files.', 403);
        }

        targetKey = submission.s3FileKey;
        originalFilename = originalFilename || submission.fileName;
      } else if (!isFaculty(auth)) {
        // If fileKey is passed directly, verify that student's userId is in the key path
        if (!targetKey.includes(`/${auth.userId}/`)) {
          return errorResponse('Forbidden: You can only access files you have submitted.', 403);
        }
      }

      const downloadData = await generatePresignedDownloadUrl({
        key: targetKey,
        filename: originalFilename,
      });

      return successResponse({
        downloadUrl: downloadData.downloadUrl,
        expiresIn: downloadData.expiresIn,
      });
    } catch (err) {
      console.error('[s3Handler.getDownloadUrl] Error:', err);
      return errorResponse(err.message, err.statusCode || 500);
    }
  },
};

export default s3Handler;
