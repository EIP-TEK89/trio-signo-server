import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedModule } from './core/seed/seed.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'assets'),
      serveRoot: '/static',
    }),
    UserModule,
    AuthModule,
    DictionaryModule,
    SeedModule,
    LessonModule,
    ExerciseModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
