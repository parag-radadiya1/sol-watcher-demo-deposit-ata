import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from '@utils/common.module';
import { MailModule } from '@mail/mail.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { TokenModelsModule } from '@entities-token/token.model.module';
import { OtpModelModule } from '@entities-otp/otp.model.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { TwilioModule } from '@app/twilio/twilio.module';
import { QueueModule } from '@app/queue';


@Module({
  imports: [
    UserModelsModule,
    CommonModule,
    MailModule,
    TokenModelsModule,
    OtpModelModule,
    TwilioModule,
    QueueModule
  ],
  controllers: [AuthController],
  providers: [AuthService, GuardAuthService],
})

export class AuthModule {}
