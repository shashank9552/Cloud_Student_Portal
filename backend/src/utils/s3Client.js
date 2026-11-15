/**
 * S3 Client and Presigned URL Generator
 * Manages private document storage and time-limited presigned URLs.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import databaseConfig from '../config/databaseConfig.js';

const s3Client = new S3Client({
  region: databaseConfig.region,
});

/**
 * Verify whether an object exists in S3 and retrieve its metadata (size, mime)
 * @param {string} key
 * @param {string} [bucket]
 * @returns {Promise<{ exists: boolean, contentLength?: number, contentType?: string }>}
 */
export const verifyS3ObjectExists = async (
  key,
  bucket = databaseConfig.s3.submissionsBucket
) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    return {
      exists: true,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (err) {
    if (
      err.name === 'NotFound' ||
      err.$metadata?.httpStatusCode === 404 ||
      err.message?.includes('Not Found')
    ) {
      return { exists: false };
    }
    // Propagate access-denied or network errors if bucket exists, or report not found
    console.warn(`[s3Client.verifyS3ObjectExists] Warning for key ${key}: ${err.message}`);
    return { exists: false, error: err.message };
  }
};

/**
 * Generate a presigned PUT URL for secure browser direct-to-S3 upload
 * Ensures frontend uploads PDFs directly to S3 without sending raw file bytes through Lambda.
 *
 * @param {Object} params
 * @param {string} [params.bucket] - S3 bucket name
 * @param {string} params.key - S3 object key (e.g. submissions/asn-1/student-1/file.pdf)
 * @param {string} [params.contentType='application/pdf'] - Enforced Content-Type
 * @param {number} [params.expiresIn] - Link validity in seconds (default 900s = 15m)
 * @returns {Promise<{ uploadUrl: string, fileKey: string, expiresIn: number }>}
 */
export const generatePresignedUploadUrl = async ({
  bucket = databaseConfig.s3.submissionsBucket,
  key,
  contentType = 'application/pdf',
  expiresIn = databaseConfig.s3.urlExpirationSeconds,
}) => {
  if (!key) throw new Error('S3 object key is required for upload URL generation.');

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl,
    fileKey: key,
    bucket,
    expiresIn,
  };
};

/**
 * Generate a presigned GET URL for secure time-limited document download
 * Adds Content-Disposition header so browser downloads as the original filename.
 *
 * @param {Object} params
 * @param {string} [params.bucket] - S3 bucket name
 * @param {string} params.key - S3 object key
 * @param {string} [params.filename] - Original file name for browser download header
 * @param {number} [params.expiresIn] - Link validity in seconds (default 900s = 15m)
 * @returns {Promise<{ downloadUrl: string, expiresIn: number }>}
 */
export const generatePresignedDownloadUrl = async ({
  bucket = databaseConfig.s3.submissionsBucket,
  key,
  filename,
  expiresIn = databaseConfig.s3.urlExpirationSeconds,
}) => {
  if (!key) throw new Error('S3 object key is required for download URL generation.');

  const commandParams = {
    Bucket: bucket,
    Key: key,
  };

  if (filename) {
    commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`;
  }

  const command = new GetObjectCommand(commandParams);
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    downloadUrl,
    fileKey: key,
    expiresIn,
  };
};

/**
 * Delete an object from S3
 * @param {string} key
 * @param {string} [bucket]
 */
export const deleteS3Object = async (key, bucket = databaseConfig.s3.submissionsBucket) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return s3Client.send(command);
};

export { s3Client };
export default {
  s3Client,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  verifyS3ObjectExists,
  deleteS3Object,
};
