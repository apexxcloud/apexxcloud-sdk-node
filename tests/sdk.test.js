const StorageSDK = require('../src/sdk');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('StorageSDK', () => {
  let sdk;

  beforeEach(() => {
    sdk = new StorageSDK({
      accessKey: 'test-access-key',
      secretKey: 'test-secret-key',
      region: 'test-region',
      bucket: 'test-bucket',
    });
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      expect(sdk).toBeInstanceOf(StorageSDK);
      expect(sdk.config.accessKey).toBe('test-access-key');
      expect(sdk.config.secretKey).toBe('test-secret-key');
      expect(sdk.config.region).toBe('test-region');
      expect(sdk.config.defaultBucket).toBe('test-bucket');
    });

    it('should throw error if access key is missing', () => {
      expect(() => {
        new StorageSDK({ secretKey: 'test-secret-key' });
      }).toThrow('Access key and secret key are required');
    });

    it('should throw error if secret key is missing', () => {
      expect(() => {
        new StorageSDK({ accessKey: 'test-access-key' });
      }).toThrow('Access key and secret key are required');
    });
  });

  describe('generateSignature', () => {
    it('should generate valid signature', () => {
      const method = 'GET';
      const path = '/test/path';
      const timestamp = '2024-03-14T12:00:00Z';

      const { signature } = sdk.generateSignature(method, path, timestamp);
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });
  });

  describe('makeRequest', () => {
    it('should make successful API requests', async () => {
      const mockResponse = { data: { success: true } };
      axios.mockResolvedValueOnce(mockResponse);

      const result = await sdk.makeRequest('GET', '/test-path');
      expect(result).toEqual(mockResponse.data);
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.apexxcloud.com/test-path',
        })
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };
      axios.mockRejectedValueOnce(errorResponse);

      await expect(sdk.makeRequest('GET', '/test-path')).rejects.toThrow(
        'API Error 404: Not found'
      );
    });
  });

  describe('file operations', () => {
    describe('uploadFile', () => {
      it('should upload file successfully', async () => {
        const mockResponse = { data: { fileId: '123' } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.upload('test-bucket', 'test-file.txt');
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: expect.stringContaining('/api/v1/files/upload'),
          })
        );
      });
    });

    describe('deleteFile', () => {
      it('should delete file successfully', async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.delete('test-bucket', 'test-file.txt');
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE',
            url: expect.stringContaining('/api/v1/files/delete'),
          })
        );
      });
    });

    describe('getSignedUrl', () => {
      it('should get signed URL successfully', async () => {
        const mockResponse = { data: { url: 'https://signed-url.com' } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.getSignedUrl('test-bucket', 'test-file.txt');
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: expect.stringContaining('/api/v1/files/signed-url'),
          })
        );
      });
    });
  });

  describe('multipart operations', () => {
    describe('startMultipartUpload', () => {
      it('should start multipart upload successfully', async () => {
        const mockResponse = { data: { uploadId: 'upload123' } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.startMultipartUpload('test-bucket', 'large-file.txt');
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: expect.stringContaining('/api/v1/files/multipart/start'),
          })
        );
      });
    });

    describe('completeMultipartUpload', () => {
      it('should complete multipart upload successfully', async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        const parts = [{ partNumber: 1, etag: 'etag1' }];
        const result = await sdk.files.completeMultipartUpload('upload123', parts);
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: expect.stringContaining('/api/v1/files/multipart/upload123/complete'),
          })
        );
      });
    });

    describe('uploadPart', () => {
      it('should upload part successfully', async () => {
        const mockResponse = { data: { etag: 'etag1' } };
        axios.mockResolvedValueOnce(mockResponse);

        const filePart = Buffer.from('test data');
        const result = await sdk.files.uploadPart('upload123', 1, filePart, {
          bucketName: 'test-bucket',
          key: 'test-key',
          totalParts: 3,
        });

        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: expect.stringContaining('/api/v1/files/multipart/upload123/upload'),
          })
        );
      });

      it('should use default bucket when not specified', async () => {
        const mockResponse = { data: { etag: 'etag1' } };
        axios.mockResolvedValueOnce(mockResponse);

        const filePart = Buffer.from('test data');
        await sdk.files.uploadPart('upload123', 1, filePart, {
          key: 'test-key',
          totalParts: 3,
        });

        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining(`bucket_name=${sdk.config.defaultBucket}`),
          })
        );
      });
    });

    describe('cancelMultipartUpload', () => {
      it('should cancel multipart upload successfully', async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.cancelMultipartUpload('upload123', {
          bucketName: 'test-bucket',
          key: 'test-key',
        });

        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: expect.stringContaining('/api/v1/files/multipart/upload123/cancel'),
          })
        );
      });

      it('should use default bucket when not specified', async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        await sdk.files.cancelMultipartUpload('upload123', {
          key: 'test-key',
        });

        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining(`bucket_name=${sdk.config.defaultBucket}`),
          })
        );
      });
    });
  });

  describe('bucket operations', () => {
    describe('listContents', () => {
      it('should list bucket contents successfully', async () => {
        const mockResponse = {
          data: {
            files: [
              { name: 'file1.txt', size: 1024 },
              { name: 'file2.txt', size: 2048 },
            ],
          },
        };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.bucket.listContents('test-bucket');
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: expect.stringContaining('/api/v1/files/list'),
          })
        );
      });
    });
  });

  describe('generateSignedUrl', () => {
    it('should generate signed URL for upload', async () => {
      const result = await sdk.generateSignedUrl('upload', {
        bucketName: 'test-bucket',
        visibility: 'private',
      });

      expect(result).toContain('/api/v1/files/upload');
      expect(result).toContain('visibility=private');
      expect(result).toContain('access_key=test-access-key');
    });

    it('should generate signed URL for delete', async () => {
      const result = await sdk.generateSignedUrl('delete', {
        bucketName: 'test-bucket',
        filePath: 'test/file.txt',
      });

      expect(result).toContain('/api/v1/files/delete');
      expect(result).toContain('file_path=test%2Ffile.txt');
    });

    it('should throw error for delete without filePath', async () => {
      await expect(sdk.generateSignedUrl('delete', { bucketName: 'test-bucket' })).rejects.toThrow(
        'filePath is required for delete operation'
      );
    });

    it('should generate signed URL for start-multipart', async () => {
      const result = await sdk.generateSignedUrl('start-multipart', {
        bucketName: 'test-bucket',
        fileName: 'large-file.txt',
        totalParts: 5,
        mimeType: 'application/pdf',
        visibility: 'private',
      });

      expect(result).toContain('/api/v1/files/multipart/start');
      expect(result).toContain('filename=large-file.txt');
      expect(result).toContain('total_parts=5');
      expect(result).toContain('mime_type=application%2Fpdf');
      expect(result).toContain('visibility=private');
    });

    it('should throw error for start-multipart without fileName', async () => {
      await expect(
        sdk.generateSignedUrl('start-multipart', { bucketName: 'test-bucket' })
      ).rejects.toThrow('fileName is required for start-multipart operation');
    });

    it('should generate signed URL for uploadpart', async () => {
      const result = await sdk.generateSignedUrl('uploadpart', {
        bucketName: 'test-bucket',
        uploadId: 'upload123',
        partNumber: 1,
        key: 'test-key',
        totalParts: 3,
      });

      expect(result).toContain('/api/v1/files/multipart/upload123/upload');
      expect(result).toContain('part_number=1');
      expect(result).toContain('key=test-key');
      expect(result).toContain('total_parts=3');
    });

    it('should throw error for invalid operation type', async () => {
      await expect(sdk.generateSignedUrl('invalid-operation', {})).rejects.toThrow(
        'Unsupported operation type: invalid-operation'
      );
    });
  });
});
