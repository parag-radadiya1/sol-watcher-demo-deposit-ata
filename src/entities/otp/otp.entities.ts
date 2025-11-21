import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import {
  IsValidCountryCode,
  IsValidMobileNumber,
} from '@utils/common.validation';
import { OTP_EXPIRY_TIME } from '@utils/constants';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { OTP_TYPE } from '@utils/enums';
import { SchemaTypes } from 'mongoose';
import { commonResponse } from '@utils/constant';

@Schema({ timestamps: true, versionKey: false, collection: 'token' })
export class Otp extends MongoSchema {
  @ApiProperty({ example: '+91' })
  @Prop({ type: String })
  @IsString()
  // @IsNotEmpty()
  @IsValidCountryCode()
  countryCode?: string;

  @ApiProperty({ example: '9900990099' })
  @Prop({ type: String })
  @IsString()
  // @IsNotEmpty()
  @IsValidMobileNumber()
  mobileNumber?: string;

  @Prop({ type: String, required: true })
  @Transform(({ value }) => value?.trim().toLowerCase())
  // @IsNotEmpty()
  @IsEmail({}, { message: commonResponse.invalidEmailAddress })
  @IsString()
  @ApiProperty({ example: 'a@gmail.com' })
  email?: string;

  @ApiProperty({ example: '123456' })
  @Prop({ type: String, default: '' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  otp: string;

  @Prop({
    type: Date,
    default: new Date(new Date().getTime() + OTP_EXPIRY_TIME),
  })
  @IsString()
  @IsNotEmpty()
  expiry: Date;

  @Prop({ type: Boolean, default: false })
  isUsed: Boolean;

  // add type for the otp field for email verification or mobile verification or update password
  @Prop({ type: String, default: OTP_TYPE.EMAIL_VERIFICATION_OTP })
  @IsString()
  @ValidateIf((o) => o.otpType)
  @IsEnum(OTP_TYPE)
  @IsNotEmpty()
  otpType: OTP_TYPE;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'user', required: false })
  userId?: string;
}

export const otpSchema = SchemaFactory.createForClass(Otp);
export const otpModel = MongooseModule.forFeature([
  { name: Otp.name, schema: otpSchema },
]);
