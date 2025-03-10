import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DictionaryModule } from './modules/dictionary/dictionary.module';

@Module({
  imports: [AuthModule, DictionaryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
