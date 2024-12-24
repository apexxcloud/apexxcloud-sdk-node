declare module 'apexxcloud-sdk' {
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

  interface BucketListOptions {
    prefix?: string;
    page?: number;
    limit?: number;
  }

  class StorageSDK {
    constructor(config: StorageSDKConfig);

    files: {
      upload(bucketName: string, filePath: string, options?: UploadOptions): Promise<any>;
      delete(bucketName: string, filePath: string): Promise<any>;
      getSignedUrl(bucketName: string, filePath: string, options?: SignedUrlOptions): Promise<any>;
      startMultipartUpload(
        bucketName: string,
        fileName: string,
        options?: MultipartUploadOptions
      ): Promise<any>;
      uploadPart(uploadId: string, partNumber: number, filePart: any, options?: any): Promise<any>;
      completeMultipartUpload(uploadId: string, parts: any[], options?: any): Promise<any>;
      cancelMultipartUpload(uploadId: string, options?: any): Promise<any>;
    };

    bucket: {
      listContents(bucketName: string, options?: BucketListOptions): Promise<any>;
    };
  }

  export = StorageSDK;
}
