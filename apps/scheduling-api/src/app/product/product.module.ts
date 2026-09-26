import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
