import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import type { Env } from './app/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<Env, true>);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableShutdownHooks(); // closes the TypeORM connection on SIGTERM/SIGINT

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
