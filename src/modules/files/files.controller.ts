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
import { Public } from '../../modules/auth/decorators/public.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
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

  @Public()
  @Get('models/:modelName')
  async downloadSignRecognizerModel(
    @Param('modelName') modelName: string,
    @Res() res: Response,
  ) {
    try {
      const modelPath = this.filesService.getSignRecognizerModelPath(modelName);
      // Utiliser res.download pour envoyer le fichier comme pièce jointe
      return res.download(
        modelPath,
        `${modelName.endsWith('.zip') ? modelName : modelName + '.zip'}`,
        (err) => {
          if (err) {
            throw new HttpException(
              'Error occurred while downloading the model',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        },
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Model not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
