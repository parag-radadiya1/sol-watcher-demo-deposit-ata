import { EnvConfig } from '@config/env.config.module';
import { DatabaseModule } from '@db/conn';
import { CustomValidationService } from '@helper/customValidation.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SeedersModule } from '@seeders/seeders.module';
import { CommonModule } from '@utils/common.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LangChainModule } from './langchain/langchain.module';
import { QueueModule } from './queue/queue.module';
const configService = new ConfigService();

@Module({
  imports: [
    EnvConfig,
    DatabaseModule.forRoot(configService.get<string>('DB_URI')),
    ScheduleModule.forRoot(),
    QueueModule,
    SeedersModule,
    AdminModule,
    UserModule,
    CommonModule,
    LangChainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    JwtWebAuthService,
    CustomValidationService,
  ],
})
export class AppModule {}
