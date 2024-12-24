declare module 'apexxcloud-sdk-node' {
  interface StorageSDKConfig {
    accessKey: string;
    secretKey: string;
    region?: string;
    bucket?: string;
  }

  interface UploadOptions {
    region?: string;
    visibility?: 'public' | 'private';
  }

  interface SignedUrlOptions {
    expiresIn?: number;
  }

  interface MultipartUploadOptions {
    totalParts?: number;
    mimeType?: string;
    visibility?: 'public' | 'private';
  }

  interface MultipartUploadPartOptions {
    bucketName?: string;
    key: string;
    totalParts: number;
  }

  interface CompleteMultipartOptions {
    bucketName?: string;
    fileName: string;
  }

  interface CancelMultipartOptions {
    bucketName?: string;
    key: string;
  }

  interface BucketListOptions {
    prefix?: string;
    page?: number;
    limit?: number;
  }

  interface SignedUrlGenerateOptions {
    bucketName?: string;
    region?: string;
    visibility?: 'public' | 'private';
    filePath?: string;
    fileName?: string;
    uploadId?: string;
    partNumber?: number;
    key?: string;
    totalParts?: number;
    mimeType?: string;
  }

  type SignedUrlType = 'upload' | 'delete' | 'start-multipart' | 'uploadpart' | 'completemultipart' | 'cancelmultipart';

  interface StorageSDK {
    files: {
      upload(bucketName: string, filePath: string, options?: UploadOptions): Promise<any>;
      delete(bucketName: string, filePath: string): Promise<any>;
      getSignedUrl(bucketName: string, filePath: string, options?: SignedUrlOptions): Promise<any>;
      startMultipartUpload(
        bucketName: string,
        fileName: string,
        options?: MultipartUploadOptions
      ): Promise<any>;
      uploadPart(
        uploadId: string,
        partNumber: number,
        filePart: any,
        options: MultipartUploadPartOptions
      ): Promise<any>;
      completeMultipartUpload(
        uploadId: string,
        parts: Array<{ ETag: string; PartNumber: number }>,
        options: CompleteMultipartOptions
      ): Promise<any>;
      cancelMultipartUpload(
        uploadId: string,
        options: CancelMultipartOptions
      ): Promise<any>;
    };

    bucket: {
      listContents(bucketName: string, options?: BucketListOptions): Promise<any>;
    };

    generateSignedUrl(type: SignedUrlType, options: SignedUrlGenerateOptions): Promise<string>;
  }

  class StorageSDK {
    constructor(config: StorageSDKConfig);
  }

  export = StorageSDK;
}
