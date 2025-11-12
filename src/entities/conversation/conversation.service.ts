import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './conversation.entities';
import { OtpModelService } from '@entities-otp/otp.service';
import { UserModelService } from '@entities-user/user.service';
import { OTP_TYPE } from '@utils/enums';

@Injectable()
export class ConversationModelService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    private readonly otpModelService: OtpModelService,
    private readonly userModelService: UserModelService,
  ) {}

  createConversation(userId: string, title?: string) {
    const value: Partial<Conversation> = {
      userId,
      title: title ?? null,
      isActive: true,
      metadata: {},
    } as Partial<Conversation>;

    return this.conversationModel.create(value);
  }

  getConversationsByUser(userId: string, limit = 50) {
    return this.conversationModel
      .find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit);
  }

  getConversationById(id: string) {
    return this.conversationModel.findById(id);
  }

  closeConversation(id: string) {
    return this.conversationModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  // Utility: verify user exists
  async validateUser(userId: string) {
    const user = await this.userModelService.getUserById(userId);
    return !!user;
  }

  // Utility: validate OTP for a user (generic). Returns the otp document if valid, otherwise null.
  async validateOtp(otp: string, userId: string, otpType: OTP_TYPE) {
    return this.otpModelService.getOtpIfValid(otp, userId, otpType);
  }
}

