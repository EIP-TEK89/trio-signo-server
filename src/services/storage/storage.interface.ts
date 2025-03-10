export interface IStorageService {
  /**
   * Returns a signed URL for a file stored in a bucket.
   * @param filePath - The path (or key) of the file.
   */
  getUrl(filePath: string): Promise<string>;

  /**
   * Returns a list of files in a bucket.
   * @param folder - The prefix to filter the files.
   */
  listFiles(search?: string): Promise<string[]>;

  /**
   * Deletes a file from a bucket.
   * @param filePath - The path (or key) of the file.
   */
  deleteFile(filePath: string): Promise<void>;
}
