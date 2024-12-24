# ApexxCloud SDK for Node.js

Official Node.js SDK for ApexxCloud Storage Service.

## Installation 

npm install apexxcloud-sdk


## Quick Start

```javascript
const StorageSDK = require('apexxcloud-sdk');
const storage = new StorageSDK({
accessKey: 'your-access-key',
secretKey: 'your-secret-key',
region: 'us-east-1',
bucket: 'default-bucket'
});
// Upload a file
async function uploadFile() {
try {
const result = await storage.files.upload('my-bucket', './path/to/file.jpg');
console.log('Upload successful:', result);
} catch (error) {
console.error('Upload failed:', error);
}
}

uploadFile();
```


## Features

- Simple file upload
- Multipart upload for large files
- File deletion
- Signed URL generation
- Bucket contents listing
- Error handling
- TypeScript support

## Documentation

For detailed documentation, visit [docs.apexxcloud.com](https://docs.apexxcloud.com)

## License

MIT