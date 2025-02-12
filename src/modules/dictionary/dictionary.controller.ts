// src/lsf/lsf.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { Sign } from './sign.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dictionary')
@Controller('signs')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get()
  async getSigns(): Promise<Sign[]> {
    return await this.dictionaryService.getAllSigns();
  }

  @Get('search/:name')
  async searchSign(@Param('name') name: string): Promise<Sign[]> {
    return await this.dictionaryService.searchSign(name);
  }
}
