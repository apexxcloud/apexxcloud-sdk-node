# ApexxCloud SDK for Node.js

Official Node.js SDK for ApexxCloud Storage Service.

## Installation 

```bash
npm install @apexxcloud/sdk-node
```

## Quick Start

```javascript
const ApexxCloud = require('@apexxcloud/sdk-node');

const storage = new ApexxCloud({
  accessKey: 'your-access-key',
  secretKey: 'your-secret-key',
  region: 'APAC',
  bucket: 'default-bucket'
});
```

## Features

- Simple file upload
- Multipart upload for large files
- File deletion
- Signed URL generation
- Bucket contents listing
- Error handling
- TypeScript support

## API Reference

### File Operations

#### Upload a File
```javascript
const result = await storage.files.upload(
  'bucket-name',  // bucket name (optional if default bucket configured)
  './path/to/file.jpg', // file path
  {
    region: 'us-east-1',     // optional
    visibility: 'public'     // optional, defaults to 'public'
  }
);
```

#### Delete a File
```javascript
await storage.files.delete(
  'bucket-name',    // bucket name (optional if default bucket configured)
  'path/to/file.jpg'  // file path in bucket
);
```

#### Get a Signed URL
```javascript
const url = await storage.files.getSignedUrl(
  'bucket-name',    // bucket name (optional if default bucket configured)
  'path/to/file.jpg', // file path in bucket
  {
    expiresIn: 3600   // optional, defaults to 3600 seconds (1 hour)
  }
);
```

### Multipart Upload Operations

#### Start Multipart Upload
```javascript
const upload = await storage.files.startMultipartUpload(
  'bucket-name',    // bucket name (optional if default bucket configured)
  'large-file.zip', // key
  {
    totalParts: 3,                          // optional, defaults to 1
    mimeType: 'application/zip',            // optional
    visibility: 'public'                    // optional, defaults to 'public'
  }
);
```

#### Upload Part
```javascript
const partResult = await storage.files.uploadPart(
  uploadId,         // from startMultipartUpload response
  1,               // part number
  filePartBuffer,  // file part as Buffer or Stream
  {
    bucketName: 'bucket-name',  // optional if default bucket configured
    key: 'file-key',           // from startMultipartUpload response
    totalParts: 3              // total number of parts
  }
);
```

#### Complete Multipart Upload
```javascript
await storage.files.completeMultipartUpload(
  uploadId,    // from startMultipartUpload response
  parts,       // array of completed parts
  {
    bucketName: 'bucket-name',     // optional if default bucket configured
    key: 'large-file.zip'     // original filename
  }
);
```

#### Cancel Multipart Upload
```javascript
await storage.files.cancelMultipartUpload(
  uploadId,    // from startMultipartUpload response
  {
    bucketName: 'bucket-name',  // optional if default bucket configured
    key: 'file-key'            // from startMultipartUpload response
  }
);
```

### Bucket Operations

#### List Bucket Contents
```javascript
const contents = await storage.bucket.listContents(
  'bucket-name',    // bucket name (optional if default bucket configured)
  {
    prefix: 'folder/',  // optional, filter by prefix
    page: 1,           // optional, defaults to 1
    limit: 20          // optional, defaults to 20
  }
);
```

### Generate Pre-signed URLs

Generate pre-signed URLs for various operations:

```javascript
const signedUrl = await storage.generateSignedUrl('upload', {
  bucketName: 'bucket-name',    // optional if default bucket configured
  visibility: 'public'          // optional, defaults to 'public'
});

// Other supported operations:
// - 'delete'
// - 'start-multipart'
// - 'uploadpart'
// - 'completemultipart'
// - 'cancelmultipart'
```

## Error Handling

The SDK throws errors with detailed messages for various failure scenarios:

```javascript
try {
  await storage.files.upload('bucket-name', './file.jpg');
} catch (error) {
  console.error('Operation failed:', error.message);
}
```

## Documentation

For detailed documentation, visit [docs.apexxcloud.com](https://docs.apexxcloud.com)

## License

MIT