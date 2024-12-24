const StorageSDK = require("../src/sdk");
const axios = require("axios");

// Mock axios
jest.mock("axios");

describe("StorageSDK", () => {
  let sdk;

  beforeEach(() => {
    sdk = new StorageSDK({
      accessKey: "test-access-key",
      secretKey: "test-secret-key",
      region: "test-region",
      bucket: "test-bucket",
    });
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create an instance with valid config", () => {
      expect(sdk).toBeInstanceOf(StorageSDK);
      expect(sdk.config.accessKey).toBe("test-access-key");
      expect(sdk.config.secretKey).toBe("test-secret-key");
      expect(sdk.config.region).toBe("test-region");
      expect(sdk.config.defaultBucket).toBe("test-bucket");
    });

    it("should throw error if access key is missing", () => {
      expect(() => {
        new StorageSDK({ secretKey: "test-secret-key" });
      }).toThrow("Access key and secret key are required");
    });

    it("should throw error if secret key is missing", () => {
      expect(() => {
        new StorageSDK({ accessKey: "test-access-key" });
      }).toThrow("Access key and secret key are required");
    });
  });

  describe("generateSignature", () => {
    it("should generate valid signature", () => {
      const method = "GET";
      const path = "/test/path";
      const timestamp = "2024-03-14T12:00:00Z";

      const { signature } = sdk.generateSignature(method, path, timestamp);
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe("string");
    });
  });

  describe("makeRequest", () => {
    it("should make successful API requests", async () => {
      const mockResponse = { data: { success: true } };
      axios.mockResolvedValueOnce(mockResponse);

      const result = await sdk.makeRequest("GET", "/test-path");
      expect(result).toEqual(mockResponse.data);
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://api.apexxcloud.com/test-path",
        })
      );
    });

    it("should handle API errors", async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: "Not found" },
        },
      };
      axios.mockRejectedValueOnce(errorResponse);

      await expect(sdk.makeRequest("GET", "/test-path")).rejects.toThrow(
        "API Error 404: Not found"
      );
    });
  });

  describe("file operations", () => {
    describe("uploadFile", () => {
      it("should upload file successfully", async () => {
        const mockResponse = { data: { fileId: "123" } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.upload("test-bucket", "test-file.txt");
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            url: expect.stringContaining("/api/v1/files/upload"),
          })
        );
      });
    });

    describe("deleteFile", () => {
      it("should delete file successfully", async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.delete("test-bucket", "test-file.txt");
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "DELETE",
            url: expect.stringContaining("/api/v1/files/delete"),
          })
        );
      });
    });

    describe("getSignedUrl", () => {
      it("should get signed URL successfully", async () => {
        const mockResponse = { data: { url: "https://signed-url.com" } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.getSignedUrl(
          "test-bucket",
          "test-file.txt"
        );
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "GET",
            url: expect.stringContaining("/api/v1/files/signed-url"),
          })
        );
      });
    });
  });

  describe("multipart operations", () => {
    describe("startMultipartUpload", () => {
      it("should start multipart upload successfully", async () => {
        const mockResponse = { data: { uploadId: "upload123" } };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.files.startMultipartUpload(
          "test-bucket",
          "large-file.txt"
        );
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            url: expect.stringContaining("/api/v1/files/multipart/start"),
          })
        );
      });
    });

    describe("completeMultipartUpload", () => {
      it("should complete multipart upload successfully", async () => {
        const mockResponse = { data: { success: true } };
        axios.mockResolvedValueOnce(mockResponse);

        const parts = [{ partNumber: 1, etag: "etag1" }];
        const result = await sdk.files.completeMultipartUpload(
          "upload123",
          parts
        );
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            url: expect.stringContaining(
              "/api/v1/files/multipart/upload123/complete"
            ),
          })
        );
      });
    });
  });

  describe("bucket operations", () => {
    describe("listContents", () => {
      it("should list bucket contents successfully", async () => {
        const mockResponse = {
          data: {
            files: [
              { name: "file1.txt", size: 1024 },
              { name: "file2.txt", size: 2048 },
            ],
          },
        };
        axios.mockResolvedValueOnce(mockResponse);

        const result = await sdk.bucket.listContents("test-bucket");
        expect(result).toEqual(mockResponse.data);
        expect(axios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "GET",
            url: expect.stringContaining("/api/v1/files/list"),
          })
        );
      });
    });
  });
});
