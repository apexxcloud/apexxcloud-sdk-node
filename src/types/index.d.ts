declare module '@apexxcloud/sdk-js' {
  type SignedUrlType =
    | 'upload'
    | 'delete'
    | 'start-multipart'
    | 'uploadpart'
    | 'completemultipart'
    | 'cancelmultipart'
    | 'download';

  interface SignedUrlOptions {
    bucketName?: string;
    region?: string;
    key: string;
    mimeType?: string;
    totalParts?: number;
    partNumber?: number;
    uploadId?: string;
    visibility?: 'public' | 'private';
    expiresIn?: number;
  }

  interface BucketConfig {
    accessKey: string;
    secretKey: string;
    baseUrl?: string;
    region?: string;
    bucket?: string;
  }

  // ... keep existing event interfaces ...

  export default class ApexxCloud {
    constructor(config: BucketConfig);

    files: {
      upload(file: Blob, options?: UploadOptions): Promise<any>;

      delete(bucketName: string, key: string): Promise<any>;
      getSignedUrl(bucketName: string, key: string, options?: { expiresIn?: number }): Promise<any>;
      startMultipartUpload(
        bucketName: string,
        key: string,
        options: { totalParts: number; mimeType?: string; visibility?: 'public' | 'private' }
      ): Promise<any>;
      uploadPart(
        uploadId: string,
        partNumber: number,
        filePart: Blob,
        options: { bucketName?: string; key: string; totalParts: number }
      ): Promise<any>;
      completeMultipartUpload(
        uploadId: string,
        parts: Array<{ ETag: string; PartNumber: number }>,
        options: { bucketName?: string; key: string }
      ): Promise<any>;
      cancelMultipartUpload(
        uploadId: string,
        options: { bucketName?: string; key: string }
      ): Promise<any>;
    };

    bucket: {
      listContents(
        bucketName: string,
        options?: { prefix?: string; page?: number; limit?: number }
      ): Promise<any>;
    };

    generateSignedUrl(type: SignedUrlType, options: SignedUrlOptions): Promise<string>;
  }
}
