declare module '@apexxcloud/sdk-node' {
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

  interface UploadOptions {
    key: string;
    bucketName?: string;
    region?: string;
    visibility?: 'public' | 'private';
    filename?: string;
    contentType?: string;
  }

  interface MultipartUploadOptions {
    key: string;
    bucketName?: string;
    totalParts: number;
    mimeType?: string;
    visibility?: 'public' | 'private';
  }

  interface UploadPartOptions {
    key: string;
    bucketName?: string;
    totalParts: number;
    filename?: string;
    contentType?: string;
  }

  interface CompleteMultipartOptions {
    key: string;
    bucketName?: string;
  }

  interface BucketContentsOptions {
    prefix?: string;
    page?: number;
    limit?: number;
  }

  interface UploadPartResponse {
    ETag: string;
    PartNumber: number;
  }

  interface CompleteMultipartResponse {
    Location: string;
    Bucket: string;
    Key: string;
    ETag: string;
  }

  interface BucketContentsResponse {
    contents: Array<{
      key: string;
      size: number;
      lastModified: string;
      etag: string;
    }>;
    page: number;
    totalPages: number;
    totalItems: number;
  }

  export default class ApexxCloud {
    constructor(config: BucketConfig);

    files: {
      upload(file: Buffer | NodeJS.ReadStream, options: UploadOptions): Promise<{ url: string }>;
      delete(bucketName: string, key: string): Promise<{ success: boolean }>;
      getSignedUrl(
        bucketName: string,
        key: string,
        options: { type: SignedUrlType; expiresIn?: number }
      ): Promise<string>;
      startMultipartUpload(
        bucketName: string,
        key: string,
        options: MultipartUploadOptions
      ): Promise<{ uploadId: string }>;
      uploadPart(
        uploadId: string,
        partNumber: number,
        filePart: Buffer | NodeJS.ReadStream,
        options: UploadPartOptions
      ): Promise<UploadPartResponse>;
      completeMultipartUpload(
        uploadId: string,
        parts: Array<UploadPartResponse>,
        options: CompleteMultipartOptions
      ): Promise<CompleteMultipartResponse>;
      cancelMultipartUpload(
        uploadId: string,
        options: CompleteMultipartOptions
      ): Promise<{ success: boolean }>;
    };

    bucket: {
      listContents(
        bucketName: string,
        options?: BucketContentsOptions
      ): Promise<BucketContentsResponse>;
    };

    generateSignedUrl(type: SignedUrlType, options: SignedUrlOptions): Promise<string>;
  }
}
