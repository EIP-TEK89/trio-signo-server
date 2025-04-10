import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedModule } from './core/seed/seed.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { ExerciseModule } from './modules/exercise/exercise.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    DictionaryModule,
    SeedModule,
    LessonModule,
    ExerciseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
