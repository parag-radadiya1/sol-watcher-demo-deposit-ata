import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Otp } from './otp.entities';
import { OtpDto } from '@utils/dto';
import { OTP_TYPE } from '@utils/enums';

@Injectable()
export class OtpModelService {
  constructor(
    @InjectModel(Otp.name)
    private readonly otpModel: Model<Otp>,
  ) {}

  setOtp(value: OtpDto): Promise<Otp | null> {
    return this.otpModel.create(value);
  }

  getOtpIfValid(
    otp: string,
    userId: string,
    otpType: OTP_TYPE,
  ): Promise<Otp | null> {
    return this.otpModel.findOne({
      otp,
      userId,
      otpType,
      isUsed: false,
      expiry: { $gt: new Date() },
    });
  }

  getOtpIfValidWithMobile(
    otp: string,
    userId: string,
    mobileNumber: string,
    countryCode: string,
    otpType: OTP_TYPE,
  ): Promise<Otp | null> {
    return this.otpModel.findOne({
      otp,
      userId,
      mobileNumber,
      countryCode,
      otpType,
      isUsed: false,
      expiry: { $gt: new Date() },
    });
  }

  setOtpAsUsed(
    otp: string,
    userId: string,
    session: ClientSession,
  ): Promise<Otp | null> {
    return this.otpModel.findOneAndUpdate(
      {
        otp,
        userId,
        isUsed: false,
      },
      { isUsed: true },
      {
        session,
        new: true,
      },
    );
  }

  getOtpCountByMobileNumber(
    countryCode: string,
    mobileNumber: string,
  ): Promise<number> {
    return this.otpModel.countDocuments({
      countryCode,
      mobileNumber,
      // create in last 1 hour
      createdAt: { $gt: new Date(new Date().getTime() - 60 * 60 * 1000) },
      // createdAt:
    });
  }
}
