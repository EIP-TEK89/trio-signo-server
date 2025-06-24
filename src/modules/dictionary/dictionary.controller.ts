import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  NotFoundException,
} from '@nestjs/common';
import { DictionaryService } from './services/dictionary.service';
import { Prisma, Sign as PrismaSign } from '@prisma/client';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateSignDto } from './dtos/create-sign.dto';
import { Sign } from './sign.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/interfaces/user.interface';

@ApiTags('Dictionary')
@Controller('signs')
export class DictionaryController {
  private readonly logger = new Logger(DictionaryController.name);

  constructor(private readonly dictionaryService: DictionaryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new sign (Admin only)' })
  @ApiBody({ type: CreateSignDto })
  @ApiCreatedResponse({
    description: 'The sign has been successfully created.',
    type: Sign,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions. Admin role required.',
  })
  async createSign(@Body() sign: Prisma.SignCreateInput): Promise<PrismaSign> {
    this.logger.log(`Creating sign with word: ${sign.word}`);
    this.logger.debug(`Sign data: ${JSON.stringify(sign)}`);

    try {
      const result = await this.dictionaryService.createSign(sign);
      this.logger.log(`Sign created successfully with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all signs' })
  @ApiOkResponse({
    description: 'All signs have been successfully retrieved.',
    type: [Sign],
  })
  @ApiNoContentResponse({ description: 'No signs found.' })
  async getSigns(): Promise<PrismaSign[]> {
    this.logger.log('Get all signs request received');

    try {
      const signs = await this.dictionaryService.getAllSigns();
      this.logger.log(`Retrieved ${signs.length} signs successfully`);
      return signs;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve signs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('search/:name')
  @Public()
  @ApiOperation({ summary: 'Search for a sign by name' })
  @ApiOkResponse({
    description: 'The sign has been successfully found.',
    type: [Sign],
  })
  @ApiNoContentResponse({ description: 'No sign found with the given name.' })
  async searchSign(@Param('name') name: string): Promise<PrismaSign[]> {
    this.logger.log(`Search sign request received for name: "${name}"`);

    try {
      const signs = await this.dictionaryService.searchSign(name);
      this.logger.log(`Found ${signs.length} signs matching "${name}"`);
      return signs;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`No signs found matching: "${name}"`);
      } else {
        this.logger.error(
          `Error searching for signs: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a sign by ID' })
  @ApiOkResponse({
    description: 'The sign has been successfully retrieved.',
    type: Sign,
  })
  @ApiResponse({
    status: 404,
    description: 'Sign not found',
  })
  async getSign(@Param('id') id: string): Promise<PrismaSign> {
    this.logger.log(`Get sign request received for ID: ${id}`);

    try {
      const sign = await this.dictionaryService.getSignById(id);
      this.logger.log(`Sign with ID ${id} successfully retrieved`);
      return sign;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Attempted to get non-existent sign with ID: ${id}`);
      } else {
        this.logger.error(
          `Error retrieving sign with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a sign by ID (Admin only)' })
  @ApiOkResponse({ description: 'The sign has been successfully deleted.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions. Admin role required.',
  })
  async deleteSign(@Param('id') id: string): Promise<void> {
    this.logger.log(`Delete sign request received for ID: ${id}`);

    try {
      await this.dictionaryService.deleteSign(id);
      this.logger.log(`Sign with ID ${id} successfully deleted`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `Attempted to delete non-existent sign with ID: ${id}`,
        );
      } else {
        this.logger.error(
          `Error deleting sign with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
