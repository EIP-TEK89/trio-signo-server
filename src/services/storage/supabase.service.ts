import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from './storage.interface';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);

  private client: SupabaseClient;
  private bucket: string;

  private directories: string[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase configuration (URL and Key) must be provided.',
      );
      throw new Error('Supabase configuration (URL and Key) must be provided.');
    }
    this.logger.verbose(`Supabase URL: ${supabaseUrl}`);
    this.logger.verbose(`Supabase Bucket: ${this.bucket}`);
    this.client = createClient(supabaseUrl, supabaseKey);

    this.client.storage.getBucket(this.bucket).then(({ data, error }) => {
      if (error) {
        this.logger.error(JSON.stringify(error));
        throw new InternalServerErrorException(
          `Error getting bucket: ${error.message}`,
        );
      }
      this.logger.verbose(`Bucket details: ${JSON.stringify(data)}`);
    });

    // Log the directories found in the bucket
    this.client.storage
      .from(this.bucket)
      .list()
      .then(({ data, error }) => {
        if (error) {
          this.logger.error(`Error listing directories: ${error.message}`);
          throw new InternalServerErrorException(
            `Error listing directories: ${error.message}`,
          );
        }
        this.logger.debug(
          `Files in bucket '${this.bucket}': ${data.map((file) => file.name).join(', ')}`,
        );
      });
  }

  /**
   * Returns a public URL for a file stored in the Supabase bucket.
   * Files are organized in alphabet-based directories (A-Z).
   * @param word - The name of the file (without extension) to retrieve.
   */
  async getUrl(word: string): Promise<string> {
    if (!word || word.length === 0) {
      this.logger.error('Word cannot be empty');
      throw new InternalServerErrorException('Word cannot be empty');
    }

    // Get the first letter of the word and make it uppercase to match directory structure
    const firstLetter = word.charAt(0).toUpperCase();
    
    // List files in the corresponding directory
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(firstLetter);
    
    if (error) {
      this.logger.error(`Error listing files in directory ${firstLetter}: ${error.message}`);
      throw new InternalServerErrorException(
        `Error listing files in directory ${firstLetter}: ${error.message}`
      );
    }
    
    // Find the file that starts with the word
    const matchingFile = data.find(file => 
      file.name.toLowerCase().startsWith(word.toLowerCase())
    );
    
    if (!matchingFile) {
      this.logger.error(`No file found for word: ${word} in directory ${firstLetter}`);
      throw new NotFoundException(`No file found for word: ${word}`);
    }
    
    // Generate the public URL including the directory path
    const filePath = `${firstLetter}/${matchingFile.name}`;
    const { data: urlData } = await this.client.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      this.logger.error(`Failed to generate URL for ${filePath}`);
      throw new InternalServerErrorException(`Failed to generate URL for ${filePath}`);
    }
    
    this.logger.debug(`Generated URL for ${word}: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  }

  /**
   * Returns a list of files in the Supabase bucket.
   * @param search - Optional search term to filter files. If provided and is a single letter,
   *                will list files in that letter's directory. Otherwise, will search all directories
   *                for files matching the search term.
   */
  async listFiles(search?: string): Promise<string[]> {
    // If search is a single letter, we can just list that directory
    if (search && search.length === 1 && this.directories.includes(search.toUpperCase())) {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(search.toUpperCase());

      if (error) {
        this.logger.error(`Error listing files in directory ${search.toUpperCase()}: ${error.message}`);
        throw new InternalServerErrorException(
          `Error listing files in directory ${search.toUpperCase()}: ${error.message}`,
        );
      }
      return data.map((file) => file.name);
    }

    // If search has more than one letter or we need to list everything
    const allFiles: string[] = [];
    
    // Only process directories that might contain the search term
    const dirsToProcess = search 
      ? [search.charAt(0).toUpperCase()] 
      : this.directories;
    
    // Get files from each relevant directory
    for (const dir of dirsToProcess) {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(dir);

      if (error) {
        this.logger.error(`Error listing files in directory ${dir}: ${error.message}`);
        continue; // Skip this directory on error, but continue with others
      }
      
      const fileNames = data.map(file => `${dir}/${file.name}`);
      
      // Filter by search term if provided
      const filteredFiles = search 
        ? fileNames.filter(fileName => fileName.toLowerCase().includes(search.toLowerCase()))
        : fileNames;
        
      allFiles.push(...filteredFiles);
    }
    
    return allFiles;
  }

  /**
   * Deletes a file from the Supabase bucket.
   * @param word - The name of the file to delete (without extension).
   *              The method will look for the file in the appropriate directory
   *              based on the first letter of the word.
   */
  async deleteFile(word: string): Promise<void> {
    if (!word || word.length === 0) {
      this.logger.error('Word cannot be empty');
      throw new InternalServerErrorException('Word cannot be empty');
    }

    // Get the first letter of the word and make it uppercase to match directory structure
    const firstLetter = word.charAt(0).toUpperCase();
    
    // List files in the corresponding directory
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(firstLetter);
    
    if (error) {
      this.logger.error(`Error listing files in directory ${firstLetter}: ${error.message}`);
      throw new InternalServerErrorException(
        `Error listing files in directory ${firstLetter}: ${error.message}`
      );
    }
    
    // Find the file that starts with the word
    const matchingFile = data.find(file => 
      file.name.toLowerCase().startsWith(word.toLowerCase())
    );
    
    if (!matchingFile) {
      this.logger.error(`No file found for word: ${word} in directory ${firstLetter}`);
      throw new NotFoundException(`No file found for word: ${word}`);
    }
    
    // Delete the file with the full path
    const filePath = `${firstLetter}/${matchingFile.name}`;
    const { error: deleteError } = await this.client.storage
      .from(this.bucket)
      .remove([filePath]);

    if (deleteError) {
      this.logger.error(`Error deleting file ${filePath}: ${deleteError.message}`);
      throw new InternalServerErrorException(
        `Error deleting file ${filePath}: ${deleteError.message}`,
      );
    }

    this.logger.verbose(`File '${filePath}' deleted.`);
  }
}
