import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PlanService } from '@entities-plan/plan.service';
import { UserModelService } from '@entities-user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageRole } from '@entities-message/message.entities';
import { Conversation } from '@entities-conversation/conversation.entities';

export interface ChatLimitCheckResult {
  canChat: boolean;
  remainingMessages: number | null; // null means unlimited
  limitReached: boolean;
  planName: string;
  chatMessageLimit: number | null;
}

@Injectable()
export class ChatLimitService {
  constructor(
    private readonly planService: PlanService,
    private readonly userModelService: UserModelService,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {}

  /**
   * Check if user can send more messages in a conversation based on their plan
   */
  async checkChatMessageLimit(
    userId: string,
    conversationId: string,
  ): Promise<ChatLimitCheckResult> {
    // Get user's plan
    const user = await this.userModelService.getUserById(userId);
    if (!user || !user.planId) {
      throw new BadRequestException('User or plan not found');
    }

    const plan = await this.planService.getPlanById(user.planId);

    // If plan has no chat message limit, allow unlimited
    if (!plan.chatMessageLimit || plan.chatMessageLimit === null) {
      return {
        canChat: true,
        remainingMessages: null,
        limitReached: false,
        planName: plan.name,
        chatMessageLimit: null,
      };
    }

    // Count AI assistant messages in this conversation
    const aiMessageCount = await this.messageModel.countDocuments({
      conversationId,
      role: MessageRole.ASSISTANT,
    });

    const remainingMessages = plan.chatMessageLimit - aiMessageCount;
    const canChat = remainingMessages > 0;

    return {
      canChat,
      remainingMessages: Math.max(0, remainingMessages),
      limitReached: !canChat,
      planName: plan.name,
      chatMessageLimit: plan.chatMessageLimit,
    };
  }

  /**
   * Validate if user can send a message, throw error if limit reached
   */
  async validateChatMessageLimit(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const result = await this.checkChatMessageLimit(userId, conversationId);

    if (result.limitReached) {
      throw new ForbiddenException(
        `Chat message limit reached for ${result.planName}. You have used ${result.chatMessageLimit} AI responses. Please upgrade your plan to continue chatting.`,
      );
    }
  }

  /**
   * Check total questions asked by user across all conversations
   */
  async checkQuestionLimit(userId: string): Promise<{
    canAsk: boolean;
    remainingQuestions: number | null;
    limitReached: boolean;
    planName: string;
    questionLimit: number | null;
  }> {
    const user = await this.userModelService.getUserById(userId);
    if (!user || !user.planId) {
      throw new BadRequestException('User or plan not found');
    }

    console.log('=== user.planId ====', user.planId);
    const plan = await this.planService.getPlanById(user.planId);

    // If plan has no question limit, allow unlimited
    if (!plan.questionLimit || plan.questionLimit === null) {
      return {
        canAsk: true,
        remainingQuestions: null,
        limitReached: false,
        planName: plan.name,
        questionLimit: null,
      };
    }

    // Count all user messages (questions) across all conversations
    const userConversations = await this.conversationModel.find({
      userId,
      isActive: true,
    });

    const conversationIds = userConversations.map((conv) => conv._id.toString());

    const questionCount = await this.messageModel.countDocuments({
      conversationId: { $in: conversationIds },
      role: MessageRole.USER,
    });

    const remainingQuestions = plan.questionLimit - questionCount;
    const canAsk = remainingQuestions > 0;

    return {
      canAsk,
      remainingQuestions: Math.max(0, remainingQuestions),
      limitReached: !canAsk,
      planName: plan.name,
      questionLimit: plan.questionLimit,
    };
  }

  /**
   * Validate if user can ask a question, throw error if limit reached
   */
  async validateQuestionLimit(userId: string): Promise<void> {
    const result = await this.checkQuestionLimit(userId);

    if (result.limitReached) {
      throw new ForbiddenException(
        `Question limit reached for ${result.planName}. You have used all ${result.questionLimit} questions. Please upgrade your plan to continue.`,
      );
    }
  }

  /**
   * Check if user has voice conversation enabled
   */
  async checkVoiceConversationEnabled(userId: string): Promise<{
    enabled: boolean;
    planName: string;
  }> {
    const user = await this.userModelService.getUserById(userId);
    if (!user || !user.planId) {
      throw new BadRequestException('User or plan not found');
    }

    const plan = await this.planService.getPlanById(user.planId);

    return {
      enabled: plan.voiceConversationEnabled,
      planName: plan.name,
    };
  }

  /**
   * Validate voice conversation access
   */
  async validateVoiceConversationAccess(userId: string): Promise<void> {
    const result = await this.checkVoiceConversationEnabled(userId);

    if (!result.enabled) {
      throw new ForbiddenException(
        `Voice conversation is not available for ${result.planName}. Please upgrade to a plan with voice support.`,
      );
    }
  }

  /**
   * Get user's current plan limits and usage
   */
  async getUserPlanLimitsAndUsage(userId: string, conversationId?: string): Promise<{
    plan: {
      name: string;
      type: string;
      chatMessageLimit: number | null;
      questionLimit: number | null;
      voiceConversationEnabled: boolean;
    };
    usage: {
      aiMessagesInConversation: number | null;
      totalQuestionsAsked: number;
      remainingChatMessages: number | null;
      remainingQuestions: number | null;
    };
  }> {
    const user = await this.userModelService.getUserById(userId);
    if (!user || !user.planId) {
      throw new BadRequestException('User or plan not found');
    }

    const plan = await this.planService.getPlanById(user.planId);

    // Get AI message count in current conversation if provided
    let aiMessagesInConversation = null;
    let remainingChatMessages = null;

    if (conversationId) {
      aiMessagesInConversation = await this.messageModel.countDocuments({
        conversationId,
        role: MessageRole.ASSISTANT,
      });

      if (plan.chatMessageLimit) {
        remainingChatMessages = Math.max(
          0,
          plan.chatMessageLimit - aiMessagesInConversation,
        );
      }
    }

    // Get total questions asked
    const userConversations = await this.conversationModel.find({
      userId,
      isActive: true,
    });

    const conversationIds = userConversations.map((conv) => conv._id.toString());

    const totalQuestionsAsked = await this.messageModel.countDocuments({
      conversationId: { $in: conversationIds },
      role: MessageRole.USER,
    });

    const remainingQuestions = plan.questionLimit
      ? Math.max(0, plan.questionLimit - totalQuestionsAsked)
      : null;

    return {
      plan: {
        name: plan.name,
        type: plan.type,
        chatMessageLimit: plan.chatMessageLimit,
        questionLimit: plan.questionLimit,
        voiceConversationEnabled: plan.voiceConversationEnabled,
      },
      usage: {
        aiMessagesInConversation,
        totalQuestionsAsked,
        remainingChatMessages,
        remainingQuestions,
      },
    };
  }
}
