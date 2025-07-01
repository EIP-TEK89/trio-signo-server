import {
  Controller,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = this.filesService.getFilePath(filename);
      return res.download(filePath, filename, (err) => {
        if (err) {
          throw new HttpException(
            'Error occurred while downloading the file',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'File not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
