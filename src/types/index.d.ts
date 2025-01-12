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

  interface DeleteOptions {
    bucketName?: string;
    region?: string;
  }

  interface PurgeOptions {
    bucketName?: string;
    region?: string;
  }

  interface MultipartUploadOptions {
    key: string;
    bucketName?: string;
    region?: string;
    totalParts: number;
    mimeType?: string;
    visibility?: 'public' | 'private';
  }

  interface UploadPartOptions {
   
    bucketName?: string;
    region?: string;
    totalParts: number;
    uploadId: string;
    partNumber: number;
    mimeType?: string;

  }

  interface CompleteMultipartOptions {
    bucketName?: string;
    region?: string;
    uploadId: string;
  }

  interface CancelMultipartOptions {
    bucketName?: string;
    region?: string;
    uploadId: string;
  }

  interface BucketContentsOptions {
    bucketName?: string;
    region?: string;
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
      delete(key: string, options: DeleteOptions): Promise<{ success: boolean }>;
      purge(key: string, options: PurgeOptions): Promise<{ success: boolean }>;
     
      startMultipartUpload(
        key: string,
        options: MultipartUploadOptions
      ): Promise<{ uploadId: string }>;
      uploadPart(
        key: string,
        filePart: Buffer | NodeJS.ReadStream,
        options: UploadPartOptions
      ): Promise<UploadPartResponse>;
      completeMultipartUpload(
        key: string,
        parts: Array<UploadPartResponse>,
        options: CompleteMultipartOptions
      ): Promise<CompleteMultipartResponse>;
      cancelMultipartUpload(
        key: string,
        options: CancelMultipartOptions
      ): Promise<{ success: boolean }>;
      getSignedUrl(
        type: string,
        options: SignedUrlOptions
      ): Promise<string>;
    };

    bucket: {
      listContents(

        options?: BucketContentsOptions
      ): Promise<BucketContentsResponse>;
    };

    generateSignedUrl(type: SignedUrlType, options: SignedUrlOptions): Promise<string>;
  }
}
