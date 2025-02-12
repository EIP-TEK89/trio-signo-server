import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IStorageService } from '../../services/storage/storage.interface';
import { Sign } from './sign.interface';

@Injectable()
export class DictionaryService {
  // For demonstration, we’re using static in-memory data.
  // In a real-world scenario, this could come from a database.
  private signs: Sign[] = [
    {
      name: 'A',
      description: 'La lettre A',
      path: 'A/a.jpeg',
    },
  ];

  constructor(
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {}

  async getAllSigns(): Promise<Sign[]> {
    const signsWithUrls = await Promise.all(
      this.signs.map(async (sign) => {
        const sourceUrl = await this.storageService.getUrl(sign.path);
        return { ...sign, sourceUrl };
      }),
    );
    return signsWithUrls;
  }

  async searchSign(name: string): Promise<Sign[]> {
    const signs = this.signs.filter((s) => s.name.toLowerCase().includes(name.toLowerCase()));
    if (signs.length === 0) {
      throw new NotFoundException('Sign not found');
    }
    const signsWithUrls = await Promise.all(
      signs.map(async (sign) => {
        const sourceUrl = await this.storageService.getUrl(sign.path);
        return { ...sign, sourceUrl };
      }),
    );
    return signsWithUrls;
  }
}
