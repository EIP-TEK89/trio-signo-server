import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {
  getFilePath(filename: string): string {
    const filePath = join(process.cwd(), 'assets', filename);
    if (!existsSync(filePath)) {
      throw new Error(`File ${filename} does not exist`);
    }
    return filePath;
  }
}
