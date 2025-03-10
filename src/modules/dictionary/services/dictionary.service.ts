import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IStorageService } from '../../../services/storage/storage.interface';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, Sign } from '@prisma/client';
import { CreateSignDto } from '../dtos/create-sign.dto';

@Injectable()
export class DictionaryService {
  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {}

  private async updateMediaUrl(sign: Sign): Promise<void> {
    const mediaUrl = await this.storageService.getUrl(sign.word);
    await this.prisma.sign.update({
      where: { id: sign.id },
      data: { mediaUrl },
    });
  }

  async getAllSigns(): Promise<Sign[]> {
    return this.prisma.sign.findMany();
  }

  async searchSign(name: string): Promise<Sign[]> {
    const signs = await this.prisma.sign.findMany({
      where: {
        word: {
          contains: name,
        },
      },
    });

    if (signs.length === 0) {
      throw new NotFoundException('Sign not found');
    }

    await Promise.all(signs.map((sign) => this.updateMediaUrl(sign)));

    return signs;
  }

  async getSignById(uid: string): Promise<Sign> {
    const sign = await this.prisma.sign.findUnique({
      where: { id: uid },
    });

    if (!sign) {
      throw new NotFoundException('Sign not found');
    }

    await this.updateMediaUrl(sign);

    return sign;
  }

  async createSign(sign: CreateSignDto): Promise<Sign> {
    const newSign = await this.prisma.sign.create({
      data: sign,
    });

    await this.updateMediaUrl(newSign);

    return newSign;
  }

  async updateSign(uid: string, sign: Sign): Promise<Sign> {
    const updatedSign = await this.prisma.sign.update({
      where: { id: uid },
      data: sign,
    });

    await this.updateMediaUrl(updatedSign);

    return updatedSign;
  }

  async deleteSign(uid: string): Promise<Sign> {
    const sign = await this.prisma.sign.delete({
      where: { id: uid },
    });

    await this.storageService.deleteFile(sign.word);

    return sign;
  }
}
