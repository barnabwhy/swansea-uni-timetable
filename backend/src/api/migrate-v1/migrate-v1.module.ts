import { Module } from '@nestjs/common';
import { ApiMigrationController } from './migrate-v1.controller';

@Module({
  imports: [],
  controllers: [ApiMigrationController],
  providers: [],
})
export class ApiMigrationModule {}
