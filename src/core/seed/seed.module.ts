import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AlphabetSeedService } from './services/alphabet-seed.service';
import { UserSeedService } from './services/user-seed.service';
import { IntermediateSeedService } from './services/intermediate-seed.service';

@Module({
  providers: [SeedService, PrismaService, UserSeedService, AlphabetSeedService, IntermediateSeedService],
})
export class SeedModule { }
