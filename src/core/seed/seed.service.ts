import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AlphabetSeedService } from './services/alphabet-seed.service';
import { UserSeedService } from './services/user-seed.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private userSeedService: UserSeedService,
    private alphabetSeedService: AlphabetSeedService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing seed service');
    await this.userSeedService.seedAdminUser();
    await this.alphabetSeedService.seedAlphabet();
  }
}
