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
    this.logger.log('Initializing SupabaseStorageService');
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      this.bucket = process.env.SUPABASE_BUCKET;

      if (!supabaseUrl || !supabaseKey) {
        this.logger.error('Missing Supabase configuration - URL or Key not provided');
        throw new Error('Supabase configuration (URL and Key) must be provided.');
      }
      
      if (!this.bucket) {
        this.logger.error('Missing Supabase bucket name in environment configuration');
        throw new Error('Supabase bucket name must be provided.');
      }
      
      this.logger.log(`Storage service configured for bucket: ${this.bucket}`);
      this.logger.debug(`Supabase URL: ${supabaseUrl}`);
      this.client = createClient(supabaseUrl, supabaseKey);
      
      // Initialize and validate bucket connection in sequence
      this.initializeBucket();
    } catch (error) {
      this.logger.error(`Failed to initialize storage service: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Initialize and validate the bucket connection
   */
  private async initializeBucket() {
    try {
      // Verify bucket exists and is accessible
      const { data, error } = await this.client.storage.getBucket(this.bucket);
      
      if (error) {
        this.logger.error(`Error accessing bucket ${this.bucket}: ${error.message}`);
        throw new InternalServerErrorException(`Error accessing bucket: ${error.message}`);
      }
      
      this.logger.log(`Successfully connected to bucket: ${this.bucket}`);
      this.logger.debug(`Bucket details: ${JSON.stringify(data)}`);
      
      // List root directories (alphabetical folders)
      await this.listRootDirectories();
    } catch (error) {
      this.logger.error(`Storage initialization failed: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * List root directories in the bucket for validation
   */
  private async listRootDirectories() {
    try {
      const startTime = Date.now();
      const { data, error } = await this.client.storage.from(this.bucket).list();
      const duration = Date.now() - startTime;
      
      if (error) {
        this.logger.error(`Error listing root directories: ${error.message}`);
        throw new InternalServerErrorException(`Error listing root directories: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        this.logger.warn(`No directories found in bucket '${this.bucket}'. Storage may be empty.`);
      } else {
        const foundDirs = data.map(file => file.name).join(', ');
        this.logger.log(`Found ${data.length} directories in bucket (in ${duration}ms)`);
        this.logger.debug(`Directories in bucket '${this.bucket}': ${foundDirs}`);
        
        // Verify all expected alphabet directories exist
        const missingDirs = this.directories.filter(dir => 
          !data.some(file => file.name === dir)
        );
        
        if (missingDirs.length > 0) {
          this.logger.warn(`Missing expected directories: ${missingDirs.join(', ')}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to list root directories: ${error.message}`, error.stack);
      // Continue initialization even if listing fails
    }
  }

  /**
   * Returns a public URL for a file stored in the Supabase bucket.
   * Files are organized in alphabet-based directories (A-Z).
   * @param word - The name of the file (without extension) to retrieve.
   */
  async getUrl(word: string): Promise<string> {
    this.logger.log(`Getting URL for file with word: ${word}`);
    const startTime = Date.now();
    
    try {
      if (!word || word.length === 0) {
        this.logger.error('Empty word provided to getUrl method');
        throw new InternalServerErrorException('Word cannot be empty');
      }

      // Get the first letter of the word and make it uppercase to match directory structure
      const firstLetter = word.charAt(0).toUpperCase();
      this.logger.debug(`Looking in directory "${firstLetter}" for files matching "${word}"`);
      
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
      
      if (!data || data.length === 0) {
        this.logger.warn(`Directory ${firstLetter} is empty, no files found`);
        throw new NotFoundException(`No files found in directory for word: ${word}`);
      }
      
      this.logger.debug(`Found ${data.length} files in directory ${firstLetter}`);
      
      // Find the file that starts with the word
      const matchingFile = data.find(file => 
        file.name.toLowerCase().startsWith(word.toLowerCase())
      );
      
      if (!matchingFile) {
        this.logger.warn(`No file found for word: ${word} in directory ${firstLetter} (${data.length} files checked)`);
        throw new NotFoundException(`No file found for word: ${word}`);
      }
      
      this.logger.debug(`Found matching file: ${matchingFile.name}`);
      
      // Generate the public URL including the directory path
      const filePath = `${firstLetter}/${matchingFile.name}`;
      this.logger.debug(`Generating public URL for path: ${filePath}`);
      
      // getPublicUrl doesn't return an error, only data
      const { data: urlData } = await this.client.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        this.logger.error(`Generated URL for ${filePath} is empty or invalid`);
        throw new InternalServerErrorException(`Failed to generate URL for ${filePath}`);
      }
      
      const duration = Date.now() - startTime;
      this.logger.log(`Successfully generated URL for "${word}" (took ${duration}ms)`);
      this.logger.debug(`URL: ${urlData.publicUrl}`);
      
      return urlData.publicUrl;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof NotFoundException) {
        // Don't log stack trace for expected "not found" errors
        this.logger.warn(`File not found for word "${word}" (operation took ${duration}ms)`);
        throw error;
      }
      
      this.logger.error(
        `Failed to get URL for word "${word}" (operation took ${duration}ms): ${error.message}`, 
        error.stack
      );
      throw error;
    }
  }

  /**
   * Returns a list of files in the Supabase bucket.
   * @param search - Optional search term to filter files. If provided and is a single letter,
   *                will list files in that letter's directory. Otherwise, will search all directories
   *                for files matching the search term.
   */
  async listFiles(search?: string): Promise<string[]> {
    const startTime = Date.now();
    this.logger.log(`Listing files${search ? ` with search term: "${search}"` : ''}`);
    
    try {
      // If search is a single letter, we can just list that specific directory
      if (search && search.length === 1 && this.directories.includes(search.toUpperCase())) {
        const dir = search.toUpperCase();
        this.logger.debug(`Listing files in single directory: ${dir}`);
        
        const { data, error } = await this.client.storage
          .from(this.bucket)
          .list(dir);

        if (error) {
          this.logger.error(`Error listing files in directory ${dir}: ${error.message}`);
          throw new InternalServerErrorException(
            `Error listing files in directory ${dir}: ${error.message}`
          );
        }
        
        if (!data || data.length === 0) {
          this.logger.debug(`No files found in directory: ${dir}`);
          return [];
        }
        
        const fileNames = data.map(file => file.name);
        const duration = Date.now() - startTime;
        this.logger.log(`Found ${fileNames.length} files in directory ${dir} (took ${duration}ms)`);
        
        return fileNames;
      }

      // If search has more than one letter or we need to list everything
      this.logger.debug('Performing multi-directory search');
      const allFiles: string[] = [];
      let errors = 0;
      
      // Only process directories that might contain the search term
      const dirsToProcess = search && search.length > 0
        ? [search.charAt(0).toUpperCase()] 
        : this.directories;
      
      this.logger.debug(`Will search in ${dirsToProcess.length} directories: ${dirsToProcess.join(', ')}`);
      
      // Get files from each relevant directory
      for (const dir of dirsToProcess) {
        try {
          const dirStartTime = Date.now();
          this.logger.debug(`Listing files in directory: ${dir}`);
          
          const { data, error } = await this.client.storage
            .from(this.bucket)
            .list(dir);

          if (error) {
            this.logger.warn(`Error listing files in directory ${dir}: ${error.message}`);
            errors++;
            continue; // Skip this directory on error, but continue with others
          }
          
          if (!data || data.length === 0) {
            this.logger.debug(`No files found in directory: ${dir}`);
            continue;
          }
          
          const fileNames = data.map(file => `${dir}/${file.name}`);
          const dirDuration = Date.now() - dirStartTime;
          this.logger.debug(`Found ${fileNames.length} files in directory ${dir} (took ${dirDuration}ms)`);
          
          // Filter by search term if provided
          const filteredFiles = search && search.length > 1
            ? fileNames.filter(fileName => fileName.toLowerCase().includes(search.toLowerCase()))
            : fileNames;
            
          if (search && search.length > 1) {
            this.logger.debug(`Filtered to ${filteredFiles.length} files matching search term: "${search}"`);
          }
          
          allFiles.push(...filteredFiles);
        } catch (error) {
          this.logger.warn(`Error processing directory ${dir}: ${error.message}`);
          errors++;
          // Continue with other directories
        }
      }
      
      const duration = Date.now() - startTime;
      
      if (errors > 0) {
        this.logger.warn(
          `Completed file listing with ${errors} directory errors. ` +
          `Found ${allFiles.length} files in total (took ${duration}ms)`
        );
      } else {
        this.logger.log(`Found ${allFiles.length} files in total (took ${duration}ms)`);
      }
      
      return allFiles;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to list files${search ? ` with search "${search}"` : ''} (took ${duration}ms): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Deletes a file from the Supabase bucket.
   * @param word - The name of the file to delete (without extension).
   *              The method will look for the file in the appropriate directory
   *              based on the first letter of the word.
   */
  async deleteFile(word: string): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Deleting file for word: ${word}`);
    
    try {
      if (!word || word.length === 0) {
        this.logger.error('Empty word provided to deleteFile method');
        throw new InternalServerErrorException('Word cannot be empty');
      }

      // Get the first letter of the word and make it uppercase to match directory structure
      const firstLetter = word.charAt(0).toUpperCase();
      this.logger.debug(`Looking in directory "${firstLetter}" for files to delete matching "${word}"`);
      
      // List files in the corresponding directory
      const listStartTime = Date.now();
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(firstLetter);
      
      const listDuration = Date.now() - listStartTime;
      
      if (error) {
        this.logger.error(`Error listing files in directory ${firstLetter}: ${error.message}`);
        throw new InternalServerErrorException(
          `Error listing files in directory ${firstLetter}: ${error.message}`
        );
      }
      
      this.logger.debug(`Listed ${data?.length || 0} files in directory ${firstLetter} (took ${listDuration}ms)`);
      
      if (!data || data.length === 0) {
        this.logger.warn(`Directory ${firstLetter} is empty, no files to delete`);
        throw new NotFoundException(`No files found in directory for word: ${word}`);
      }
      
      // Find the file that starts with the word
      const matchingFile = data.find(file => 
        file.name.toLowerCase().startsWith(word.toLowerCase())
      );
      
      if (!matchingFile) {
        this.logger.warn(`No file found for word: ${word} in directory ${firstLetter} (${data.length} files checked)`);
        throw new NotFoundException(`No file found for word: ${word}`);
      }
      
      this.logger.debug(`Found matching file to delete: ${matchingFile.name}`);
      
      // Delete the file with the full path
      const filePath = `${firstLetter}/${matchingFile.name}`;
      this.logger.debug(`Deleting file at path: ${filePath}`);
      
      const deleteStartTime = Date.now();
      const { error: deleteError } = await this.client.storage
        .from(this.bucket)
        .remove([filePath]);
      
      const deleteDuration = Date.now() - deleteStartTime;

      if (deleteError) {
        this.logger.error(`Error deleting file ${filePath}: ${deleteError.message}`);
        throw new InternalServerErrorException(
          `Error deleting file ${filePath}: ${deleteError.message}`,
        );
      }

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `File '${filePath}' deleted successfully (deletion: ${deleteDuration}ms, total: ${totalDuration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof NotFoundException) {
        // Don't log stack trace for expected "not found" errors
        this.logger.warn(`File not found for deletion - word: "${word}" (operation took ${duration}ms)`);
        throw error;
      }
      
      this.logger.error(
        `Failed to delete file for word "${word}" (operation took ${duration}ms): ${error.message}`, 
        error.stack
      );
      throw error;
    }
  }
}
