const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');

class StorageSDK {
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

    // Initialize API clients
    this.files = {
      upload: this.uploadFile.bind(this),
      delete: this.deleteFile.bind(this),
      getSignedUrl: this.getSignedUrl.bind(this),
      startMultipartUpload: this.startMultipartUpload.bind(this),
      uploadPart: this.uploadPart.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      cancelMultipartUpload: this.cancelMultipartUpload.bind(this),
    };

    this.bucket = {
      listContents: this.getBucketContents.bind(this),
    };
  }

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

  // File Operations
  async uploadFile(bucketName, filePath, options = {}) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: options.region || this.config.region,
      visibility: options.visibility || 'public',
    });

    const path = `/api/v1/files/upload?${queryParams.toString()}`;

    return this.makeRequest('POST', path, {
      data: form,
      headers: form.getHeaders(),
    });
  }

  async deleteFile(bucketName, filePath) {
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      file_path: filePath,
    });

    const path = `/api/v1/files/delete?${queryParams.toString()}`;
    return this.makeRequest('DELETE', path);
  }

  async getSignedUrl(bucketName, filePath, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      file_path: filePath,
      expires_in: options.expiresIn || 3600,
    });

    const path = `/api/v1/files/signed-url?${queryParams.toString()}`;
    return this.makeRequest('GET', path);
  }

  // Multipart Upload Operations
  async startMultipartUpload(bucketName, fileName, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      filename: fileName,
      total_parts: options.totalParts || 1,
      mime_type: options.mimeType || 'application/octet-stream',
      visibility: options.visibility || 'public',
    });

    const path = `/api/v1/files/multipart/start?${queryParams.toString()}`;
    return this.makeRequest('POST', path);
  }

  async uploadPart(uploadId, partNumber, filePart, options = {}) {
    const form = new FormData();
    form.append('file', filePart);

    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      part_number: partNumber,
      key: options.key,
      total_parts: options.totalParts,
    });

    const path = `/api/v1/files/multipart/${uploadId}/upload?${queryParams.toString()}`;

    return this.makeRequest('POST', path, {
      data: form,
      headers: form.getHeaders(),
    });
  }

  async completeMultipartUpload(uploadId, parts, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      file_name: options.fileName,
    });

    const path = `/api/v1/files/multipart/${uploadId}/complete?${queryParams.toString()}`;

    return this.makeRequest('POST', path, {
      data: { parts },
    });
  }

  async cancelMultipartUpload(uploadId, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: options.bucketName || this.config.defaultBucket,
      region: this.config.region,
      key: options.key,
    });

    const path = `/api/v1/files/multipart/${uploadId}/cancel?${queryParams.toString()}`;
    return this.makeRequest('POST', path);
  }

  // Bucket Operations
  async getBucketContents(bucketName, options = {}) {
    const queryParams = new URLSearchParams({
      bucket_name: bucketName || this.config.defaultBucket,
      region: this.config.region,
      prefix: options.prefix || '',
      page: options.page || 1,
      limit: options.limit || 20,
    });

    const path = `/api/v1/files/list?${queryParams.toString()}`;
    return this.makeRequest('GET', path);
  }
}

module.exports = StorageSDK;
