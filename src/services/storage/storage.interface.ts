export interface IStorageService {
  /**
   * Returns a signed URL for a file stored in a bucket.
   * @param filePath - The path (or key) of the file.
   */
  getUrl(filePath: string): Promise<string>;

  // You can add more methods as needed (e.g., uploadFile, deleteFile, etc.)
}
