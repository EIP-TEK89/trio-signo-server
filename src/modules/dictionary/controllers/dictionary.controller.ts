import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { DictionaryService } from '../services/dictionary.service';
import { Prisma, Sign as PrismaSign} from '@prisma/client';
import { ApiBody, ApiCreatedResponse, ApiFoundResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSignDto } from '../dtos/create-sign.dto';
import { Sign } from '../sign.entity';

@ApiTags('Dictionary')
@Controller('signs')
export class DictionaryController {
  private readonly logger = new Logger(DictionaryController.name);

  constructor(private readonly dictionaryService: DictionaryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sign' })
  @ApiBody({ type: CreateSignDto })
  @ApiCreatedResponse({ description: 'The sign has been successfully created.', type: Sign })
  async createSign(@Body() sign: Prisma.SignCreateInput): Promise<PrismaSign> {
    this.logger.verbose(`Creating sign...`);
    this.logger.debug(`Sign: ${JSON.stringify(sign)}`);
    return await this.dictionaryService.createSign(sign);
  }

  @Get()
  @ApiOperation({ summary: 'Get all signs' })
  @ApiOkResponse({ description: 'All signs have been successfully retrieved.', type: [Sign] })
  @ApiNoContentResponse({ description: 'No signs found.' })
  async getSigns(): Promise<PrismaSign[]> {
    return await this.dictionaryService.getAllSigns();
  }

  @Get('search/:name')
  @ApiOperation({ summary: 'Search for a sign by name' })
  @ApiOkResponse({ description: 'The sign has been successfully found.', type: [Sign] })
  @ApiNoContentResponse({ description: 'No sign found with the given name.' })
  async searchSign(@Param('name') name: string): Promise<PrismaSign[]> {
    return await this.dictionaryService.searchSign(name);
  }
}
