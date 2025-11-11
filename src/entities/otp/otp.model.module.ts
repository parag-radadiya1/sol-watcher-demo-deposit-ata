import { Module } from '@nestjs/common';
import { otpModel } from './otp.entities';
import { OtpModelService } from './otp.service';

@Module({
  imports: [otpModel],
  controllers: [],
  providers: [OtpModelService],
  exports: [otpModel, OtpModelService],
})
export class OtpModelModule {}
