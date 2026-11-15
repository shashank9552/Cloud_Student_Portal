/**
 * API Gateway Response Formatter
 * Standardizes HTTP status codes, JSON serialization, and CORS headers.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,PATCH,DELETE',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

/**
 * Build standard API Gateway proxy response
 * @param {number} statusCode
 * @param {Object|string} body
 * @param {Object} [customHeaders={}]
 */
export const buildResponse = (statusCode, body, customHeaders = {}) => {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...customHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
};

/**
 * Standard success response wrapper
 * @param {*} data - Result payload
 * @param {number} [statusCode=200]
 * @param {string} [message] - Optional human-readable message
 */
export const successResponse = (data, statusCode = 200, message = undefined) => {
  return buildResponse(statusCode, {
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

/**
 * Standard error response wrapper
 * @param {string} message - Error description
 * @param {number} [statusCode=500]
 * @param {*} [errorDetails=null] - Optional detailed error / validation info
 */
export const errorResponse = (message, statusCode = 500, errorDetails = null) => {
  return buildResponse(statusCode, {
    success: false,
    error: {
      message,
      statusCode,
      ...(errorDetails ? { details: errorDetails } : {}),
    },
  });
};

export default {
  corsHeaders,
  buildResponse,
  successResponse,
  errorResponse,
};
