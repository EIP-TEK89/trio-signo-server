// src/lsf/lsf.module.ts
import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { SupabaseStorageService } from '../../services/storage/supabase.service';

@Module({
  controllers: [DictionaryController],
  providers: [
    DictionaryService,
    {
      provide: 'IStorageService',
      useClass: SupabaseStorageService, // Swap this with your OracleStorageService later if needed
    },
  ],
  exports: [DictionaryService],
})
export class DictionaryModule {}
