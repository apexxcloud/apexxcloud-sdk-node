const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * ApexxCloud SDK for Node.js
 * Client for interacting with the ApexxCloud Storage API
 */
class ApexxCloud {
  /**
   * Creates a new ApexxCloud client instance
   * @param {Object} config - Configuration options
   * @param {string} config.accessKey - Your ApexxCloud access key
   * @param {string} config.secretKey - Your ApexxCloud secret key
   * @param {string} [config.region] - The region to use for requests
   * @param {string} [config.bucket] - Default bucket name for operations
   * @throws {Error} When access key or secret key is missing
   */
  constructor(config) {
    if (!config.accessKey || !config.secretKey) {
      throw new Error('Access key and secret key are required');
    }

    this.config = {
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      baseUrl: 'https://api.apexxcloud.com',
      region: config.region,
      defaultBucket: config.bucket,
    };

    /**
     * File operations
     * @type {{
     *   upload: (file: (Buffer|import('stream').ReadStream), options: {
     *     key: string,
     *     bucketName?: string,
     *     region?: string,
     *     visibility?: 'public'|'private',
     *     filename?: string,
     *     contentType?: string
     *   }) => Promise<{url: string}>,
     *   delete: (bucketName: string, key: string) => Promise<{success: boolean}>,
     *   getSignedUrl: (bucketName: string, key: string, options: {
     *     type: ('upload'|'delete'|'start-multipart'|'uploadpart'|'completemultipart'|'cancelmultipart'|'download'),
     *     expiresIn?: number
     *   }) => Promise<string>,
     *   startMultipartUpload: (bucketName: string, key: string, options: {
     *     totalParts: number,
     *     mimeType?: string,
     *     visibility?: 'public'|'private'
     *   }) => Promise<{uploadId: string}>,
     *   uploadPart: (uploadId: string, partNumber: number, filePart: (Buffer|import('stream').ReadStream), options: {
     *     key: string,
     *     bucketName?: string,
     *     totalParts: number,
     *     filename?: string,
     *     contentType?: string
     *   }) => Promise<{ETag: string, PartNumber: number}>,
     *   completeMultipartUpload: (uploadId: string, parts: Array<{ETag: string, PartNumber: number}>, options: {
     *     key: string,
     *     bucketName?: string
     *   }) => Promise<{Location: string, Bucket: string, Key: string, ETag: string}>,
     *   cancelMultipartUpload: (uploadId: string, options: {
     *     key: string,
     *     bucketName?: string
     *   }) => Promise<{success: boolean}>
     * }}
     */
    this.files = {
      upload: this.uploadFile.bind(this),
      delete: this.deleteFile.bind(this),
      getSignedUrl: (bucketName, key, options) =>
        this.generateSignedUrl(options.type, { bucketName, key, ...options }),
      startMultipartUpload: this.startMultipartUpload.bind(this),
      uploadPart: this.uploadPart.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      cancelMultipartUpload: this.cancelMultipartUpload.bind(this),
    };

    /**
     * Bucket operations
     * @type {{
     *   listContents: (bucketName: string, options?: {
     *     prefix?: string,
     *     page?: number,
     *     limit?: number
     *   }) => Promise<{
     *     contents: Array<{
     *       key: string,
     *       size: number,
     *       lastModified: string,
     *       etag: string
     *     }>,
     *     page: number,
     *     totalPages: number,
     *     totalItems: number
     *   }>
     * }}
     */
    this.bucket = {
      listContents: this.getBucketContents.bind(this),
    };
  }

  /**
   * Generates a signature for API requests
   * @private
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {string} [timestamp] - ISO timestamp (defaults to current time)
   * @returns {{signature: string, timestamp: string}} Signature and timestamp
   */
  generateSignature(method, path, timestamp = new Date().toISOString()) {
    const stringToSign = `${method}\n${path}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(stringToSign)
      .digest('hex');

    return {
      signature,
      timestamp,
    };
  }

  generateHeaders(method, path) {
    const { signature, timestamp } = this.generateSignature(method, path);

    return {
      'X-Access-Key': this.config.accessKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    };
  }

  async makeRequest(method, path, options = {}) {
    const headers = this.generateHeaders(method, path);
    const url = `${this.config.baseUrl}${path}`;

    try {
      const response = await axios({
        method,
        url,
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(`API Error ${status}: ${data.message || JSON.stringify(data)}`);
    }
    return error;
  }

  /**
   * Uploads a file to ApexxCloud storage
   * @param {Buffer|ReadStream} fileData - File data to upload
   * @param {Object} options - Upload options
   * @param {string} options.key - Object key/path in the bucket
   * @param {string} [options.bucketName] - Target bucket name
   * @param {string} [options.region] - Target region
   * @param {string} [options.visibility="public"] - File visibility
   * @param {string} [options.filename] - Original filename
   * @param {string} [options.contentType] - File MIME type
   * @returns {Promise<Object>} Upload response
   * @throws {Error} When required parameters are missing
   */
  async uploadFile(fileData, options = {}) {
    if (!fileData) {
      throw new Error('fileData is required for upload operation');
    }
    if (!options.key) {
      throw new Error('key is required for upload operation');
    }

    const form = new FormData();

    // The field name MUST be "file" to match multer's expectations
    form.append('file', fileData, {
      filename: options.filename || options.key,
      contentType: options.contentType || 'application/octet-stream',
      knownLength: fileData.length, // Add the buffer length
    });

    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: options.region || this.config.region,
      visibility: options.visibility || 'public',
      key: options.key,
    });

    const path = `/api/v1/files/upload?${queryParams.toString()}`;

    // Get the form length
    const formLength = await new Promise((resolve, reject) => {
      form.getLength((err, length) => {
        if (err) reject(err);
        resolve(length);
      });
    });

    return this.makeRequest('PUT', path, {
      data: form,
      headers: {
        ...form.getHeaders(),
        'Content-Length': formLength, // Add Content-Length header
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  /**
   * Deletes a file from ApexxCloud storage
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key to delete
   * @returns {Promise<Object>} Deletion response
   * @throws {Error} When key is missing
   */
  async deleteFile(bucketName, key) {
    if (!key) {
      throw new Error('key is required for delete operation');
    }

    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      key: key,
    });

    const path = `/api/v1/files/delete?${queryParams.toString()}`;
    return this.makeRequest('DELETE', path);
  }

  /**
   * Initiates a multipart upload
   * @param {string} bucketName - Bucket name
   * @param {string} key - Object key
   * @param {Object} options - Upload options
   * @param {number} options.totalParts - Total number of parts
   * @param {string} [options.mimeType="application/octet-stream"] - File MIME type
   * @param {string} [options.visibility="public"] - File visibility
   * @returns {Promise<Object>} Multipart upload initialization response
   * @throws {Error} When required parameters are missing
   */
  async startMultipartUpload(bucketName, key, options = {}) {
    if (!key) {
      throw new Error('key is required for multipart upload');
    }
    if (!options.totalParts) {
      throw new Error('totalParts is required for multipart upload');
    }
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      key: key,
      mimeType: options.mimeType || 'application/octet-stream',
      visibility: options.visibility || 'public',
      totalParts: options.totalParts?.toString() || '0',
    });

    const path = `/api/v1/files/multipart/start?${queryParams.toString()}`;
    return this.makeRequest('POST', path);
  }

  async uploadPart(uploadId, partNumber, filePart, options = {}) {
    if (!uploadId) {
      throw new Error('uploadId is required for upload part');
    }
    if (!partNumber) {
      throw new Error('partNumber is required for upload part');
    }
    if (!options.key) {
      throw new Error('key is required for upload part');
    }
    if (!options.totalParts) {
      throw new Error('totalParts is required for upload part');
    }

    const form = new FormData();

    form.append('file', filePart, {
      filename: options.filename || options.key,
      contentType: options.contentType || 'application/octet-stream',
      knownLength: filePart.length, // Add the buffer length
    });

    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      partNumber: partNumber,
      key: options.key,
      totalParts: options.totalParts,
    });

    const path = `/api/v1/files/multipart/${uploadId}?${queryParams.toString()}`;

    return this.makeRequest('POST', path, {
      data: form,
      headers: form.getHeaders(),
    });
  }

  async completeMultipartUpload(uploadId, parts, options = {}) {
    if (!uploadId) {
      throw new Error('uploadId is required for complete multipart upload');
    }
    if (!Array.isArray(parts)) {
      throw new Error('parts must be an array of {ETag, PartNumber}');
    }
    if (!options.key) {
      throw new Error('key is required for complete multipart upload');
    }

    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      key: options.key,
    });

    const path = `/api/v1/files/multipart/${uploadId}/complete?${queryParams.toString()}`;

    return this.makeRequest('POST', path, {
      data: { parts },
    });
  }

  async cancelMultipartUpload(uploadId, options = {}) {
    if (!uploadId) {
      throw new Error('uploadId is required for cancel multipart upload');
    }
    if (!options.key) {
      throw new Error('key is required for cancel multipart upload');
    }

    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      key: options.key,
    });

    const path = `/api/v1/files/multipart/${uploadId}?${queryParams.toString()}`;
    return this.makeRequest('DELETE', path);
  }

  /**
   * Lists contents of a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} [options] - Listing options
   * @param {string} [options.prefix=""] - Filter results by prefix
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Results per page
   * @returns {Promise<Object>} Bucket contents
   */
  async getBucketContents(bucketName, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      prefix: options.prefix || '',
      page: options.page || 1,
      limit: options.limit || 20,
    });

    const path = `/api/v1/files/contents?${queryParams.toString()}`;
    return this.makeRequest('GET', path);
  }

  /**
   * Generates a signed URL for various operations
   * @param {('upload'|'delete'|'start-multipart'|'uploadpart'|'completemultipart'|'cancelmultipart'|'download')} type - Operation type
   * @param {Object} options - URL options
   * @param {string} options.key - Object key
   * @param {string} [options.bucketName] - Bucket name
   * @param {string} [options.region] - Region
   * @param {string} [options.visibility] - File visibility (for upload operations)
   * @param {number} [options.expiresIn] - URL expiration in seconds (for download)
   * @param {string} [options.uploadId] - Upload ID (for multipart operations)
   * @param {number} [options.partNumber] - Part number (for uploadpart)
   * @param {number} [options.totalParts] - Total parts (for multipart operations)
   * @param {string} [options.mimeType] - File MIME type (for start-multipart)
   * @returns {Promise<string>} Signed URL
   * @throws {Error} When required parameters are missing or operation type is invalid
   */
  async generateSignedUrl(type, options = {}) {
    // Add validation for operation type first
    const validOperations = [
      'upload',
      'delete',
      'start-multipart',
      'uploadpart',
      'completemultipart',
      'cancelmultipart',
      'download',
    ];
    if (!validOperations.includes(type)) {
      throw new Error(`Unsupported operation type: ${type}`);
    }

    // Handle other operation types (existing generateSignedUrl logic)
    const timestamp = new Date().toISOString();
    let path;
    let method;
    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: options.region || this.config.region,
      key: options.key,
    });

    switch (type) {
      case 'upload':
        path = '/api/v1/files/upload';
        method = 'PUT';
        queryParams.append('visibility', options.visibility || 'public');
        break;

      case 'delete':
        if (!options.key) {
          throw new Error('key is required for delete operation');
        }
        path = '/api/v1/files/delete';
        method = 'DELETE';

        break;

      case 'start-multipart':
        if (!options.key) {
          throw new Error('key is required for start-multipart operation');
        }
        if (!options.totalParts) {
          throw new Error('totalParts is required for start-multipart operation');
        }
        if (!options.mimeType) {
          throw new Error('mimeType is required for start-multipart operation');
        }

        path = '/api/v1/files/multipart/start';
        method = 'POST';

        queryParams.append('totalParts', options.totalParts);
        queryParams.append('mimeType', options.mimeType);
        queryParams.append('visibility', options.visibility || 'public');
        break;

      case 'uploadpart':
        if (!options.uploadId) {
          throw new Error('uploadId is required for uploadpart operation');
        }
        if (!options.partNumber) {
          throw new Error('partNumber is required for uploadpart operation');
        }
        if (!options.key) {
          throw new Error('key is required for uploadpart operation');
        }
        if (!options.totalParts) {
          throw new Error('totalParts is required for uploadpart operation');
        }
        path = `/api/v1/files/multipart/${options.uploadId}`;
        method = 'POST';
        queryParams.append('partNumber', options.partNumber);

        queryParams.append('totalParts', options.totalParts);
        break;

      case 'completemultipart':
        if (!options.uploadId) {
          throw new Error('uploadId is required for completemultipart operation');
        }
        if (!options.key) {
          throw new Error('key is required for completemultipart operation');
        }
        path = `/api/v1/files/multipart/${options.uploadId}/complete`;
        method = 'POST';

        break;

      case 'cancelmultipart':
        if (!options.uploadId) {
          throw new Error('uploadId is required for cancelmultipart operation');
        }
        if (!options.key) {
          throw new Error('key is required for cancelmultipart operation');
        }
        path = `/api/v1/files/multipart/${options.uploadId}`;
        method = 'DELETE';

        break;

      case 'download':
        if (!options.key) {
          throw new Error('key is required for signed URL operation');
        }

        method = 'GET';

        queryParams.append('expiresIn', options.expiresIn || 3600);
        path = '/api/v1/files/signed-url?' + queryParams.toString();
        return this.makeRequest('GET', path, {});

      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }

    // Add the queryParams to the path before generating signature
    const fullPath = `${path}?${queryParams.toString()}`;
    const { signature } = this.generateSignature(method, fullPath, timestamp);

    // Add auth params
    queryParams.append('access_key', this.config.accessKey);
    queryParams.append('signature', signature);
    queryParams.append('timestamp', timestamp);

    return `${this.config.baseUrl}${path}?${queryParams.toString()}`;
  }
}

module.exports = ApexxCloud;
