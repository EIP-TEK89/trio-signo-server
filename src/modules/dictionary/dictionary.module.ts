import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './services/dictionary.service';
import { SupabaseStorageService } from '../../services/storage/supabase.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [DictionaryController],
  providers: [
    DictionaryService,
    {
      provide: 'IStorageService',
      useClass: SupabaseStorageService, // Swap this with our OracleStorageService later if needed
    },
    PrismaService,
  ],
  exports: [DictionaryService],
})
export class DictionaryModule {}
