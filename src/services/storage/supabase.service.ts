import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from './storage.interface';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);

  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    // The bucket name can also be defined in your env configuration.
    this.bucket = process.env.SUPABASE_BUCKET || 'default-bucket';
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase configuration (URL and Key) must be provided.');
      throw new Error('Supabase configuration (URL and Key) must be provided.');
    }
    this.logger.verbose(`Supabase URL: ${supabaseUrl}`);
    this.logger.verbose(`Supabase Bucket: ${this.bucket}`);
    this.client = createClient(supabaseUrl, supabaseKey);

    // Check if the bucket exists
    this.client.storage.from(this.bucket).list().then(({ data, error }) => {
      if (error) {
        this.logger.error(`Error listing files in bucket: ${error.message}`);
        throw new InternalServerErrorException(`Error listing files in bucket: ${error.message}`);
      }
      if (!data) {
        this.logger.error(`Bucket '${this.bucket}' does not exist.`);
        throw new InternalServerErrorException(`Bucket '${this.bucket}' does not exist.`);
      }
      this.logger.verbose(`Bucket '${this.bucket}' exists.`);
    });
  }

  /**
   * Returns a signed URL for a file stored in the Supabase bucket.
   * @param filePath - The path (or key) of the file in the bucket.
   * @param expiresIn - Expiration time in seconds for the signed URL (default is 60 seconds).
   */
  async getUrl(filePath: string): Promise<string> {
    const { data } = await this.client.storage.from(this.bucket).getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      this.logger.error('Failed to generate URL');
      throw new InternalServerErrorException('Failed to generate URL');
    }
    return data.publicUrl;
  }

  /**
   * Returns a list of files in the Supabase bucket.
   * @param folder - The prefix to filter the files.
   */
  async listFiles(folder?: string): Promise<string[]> {
    const { data, error } = await this.client.storage.from(this.bucket).list(folder);

    if (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw new InternalServerErrorException(`Error listing files: ${error.message}`);
    }
    return data.map((file) => file.name);
  }
}
