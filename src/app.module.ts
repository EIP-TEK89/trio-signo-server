import { Module } from '@nestjs/common';
import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [UserModule, DictionaryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
