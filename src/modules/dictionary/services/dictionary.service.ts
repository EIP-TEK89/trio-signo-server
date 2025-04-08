import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { IStorageService } from '../../../services/storage/storage.interface';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, Sign } from '@prisma/client';
import { CreateSignDto } from '../dtos/create-sign.dto';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {
    this.logger.log('Dictionary service initialized');
  }

  private async updateMediaUrl(sign: Sign): Promise<void> {
    this.logger.debug(`Updating media URL for sign: ${sign.word} (ID: ${sign.id})`);
    try {
      const mediaUrl = await this.storageService.getUrl(sign.word);
      this.logger.debug(`Retrieved media URL: ${mediaUrl}`);
      await this.prisma.sign.update({
        where: { id: sign.id },
        data: { mediaUrl },
      });
      this.logger.debug(`Updated media URL for sign ${sign.id}`);
    } catch (error) {
      this.logger.error(`Failed to update media URL for sign ${sign.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllSigns(): Promise<Sign[]> {
    this.logger.log('Fetching all signs');
    try {
      const signs = await this.prisma.sign.findMany();
      this.logger.debug(`Retrieved ${signs.length} signs from database`);
      return signs;
    } catch (error) {
      this.logger.error(`Failed to fetch signs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchSign(name: string): Promise<Sign[]> {
    this.logger.log(`Searching for signs with name containing: ${name}`);
    
    try {
      const signs = await this.prisma.sign.findMany({
        where: {
          word: {
            contains: name,
          },
        },
      });

      this.logger.debug(`Found ${signs.length} signs matching "${name}"`);

      if (signs.length === 0) {
        this.logger.warn(`No signs found for search term: ${name}`);
        throw new NotFoundException('Sign not found');
      }

      this.logger.debug('Updating media URLs for found signs');
      await Promise.all(signs.map((sign) => this.updateMediaUrl(sign)));

      return signs;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error searching for signs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSignById(uid: string): Promise<Sign> {
    this.logger.log(`Fetching sign with ID: ${uid}`);
    
    try {
      const sign = await this.prisma.sign.findUnique({
        where: { id: uid },
      });

      if (!sign) {
        this.logger.warn(`No sign found with ID: ${uid}`);
        throw new NotFoundException('Sign not found');
      }

      this.logger.debug(`Found sign: ${sign.word} (ID: ${sign.id})`);
      await this.updateMediaUrl(sign);

      return sign;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching sign with ID ${uid}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createSign(sign: CreateSignDto): Promise<Sign> {
    this.logger.log(`Creating new sign: ${sign.word}`);
    
    try {
      this.logger.debug(`Sign data: ${JSON.stringify(sign)}`);
      const newSign = await this.prisma.sign.create({
        data: sign,
      });

      this.logger.debug(`Sign created with ID: ${newSign.id}`);
      await this.updateMediaUrl(newSign);

      this.logger.log(`Successfully created sign: ${newSign.word} (ID: ${newSign.id})`);
      return newSign;
    } catch (error) {
      this.logger.error(`Error creating sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSign(uid: string, sign: Sign): Promise<Sign> {
    this.logger.log(`Updating sign with ID: ${uid}`);
    
    try {
      this.logger.debug(`Update data: ${JSON.stringify(sign)}`);
      const updatedSign = await this.prisma.sign.update({
        where: { id: uid },
        data: sign,
      });

      this.logger.debug(`Sign updated successfully: ${updatedSign.id}`);
      await this.updateMediaUrl(updatedSign);

      this.logger.log(`Successfully updated sign: ${updatedSign.word} (ID: ${updatedSign.id})`);
      return updatedSign;
    } catch (error) {
      this.logger.error(`Error updating sign ${uid}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteSign(uid: string): Promise<Sign> {
    this.logger.log(`Deleting sign with ID: ${uid}`);
    
    try {
      // Get the sign first to have the word for storage deletion
      const existingSign = await this.prisma.sign.findUnique({
        where: { id: uid },
      });

      if (!existingSign) {
        this.logger.warn(`No sign found with ID: ${uid} for deletion`);
        throw new NotFoundException(`Sign with ID ${uid} not found`);
      }

      this.logger.debug(`Found sign to delete: ${existingSign.word}`);
      
      // Delete from database
      const sign = await this.prisma.sign.delete({
        where: { id: uid },
      });
      
      this.logger.debug(`Sign deleted from database: ${sign.id}`);

      // Delete associated file
      try {
        await this.storageService.deleteFile(sign.word);
        this.logger.debug(`Associated media file for ${sign.word} deleted`);
      } catch (storageError) {
        // Log but don't fail if media deletion fails
        this.logger.warn(
          `Sign ${sign.id} was deleted from database, but failed to delete media: ${storageError.message}`,
          storageError.stack
        );
      }

      this.logger.log(`Successfully deleted sign: ${sign.word} (ID: ${sign.id})`);
      return sign;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting sign ${uid}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
