import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanType } from '@entities-plan/plan.entities';

@Injectable()
export class PlanSeederService {
  private readonly logger = new Logger(PlanSeederService.name);

  constructor(
    @InjectModel(Plan.name)
    private planModel: Model<Plan>,
  ) {}

  async createDefaultPlans(): Promise<void> {
    try {
      const existingPlansCount = await this.planModel.countDocuments();
      if (existingPlansCount > 0) {
        this.logger.log('Plans already exist. Skipping plan seeding.');
        return;
      }

      const plans = [
        // FREE PLAN - Given to all new users on registration
        {
          name: 'Free Plan',
          description: 'Free plan for new users with basic features',
          type: PlanType.FREE,
          tokenBalance: 5000000, // Initial balance for new users
          dailyTokenLimit: 500000, // 50k tokens per day
          monthlyTokenLimit: 15000000, // 1.5 million tokens per month (total input+output)
          perRequestTokenLimit: 1000000, // 10k tokens per request
          chatMessageLimit: 5, // Only 5 AI responses allowed in chat
          questionLimit: 5, // User can only ask 5 questions
          voiceConversationEnabled: false, // No voice for free plan
          price: 0,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'Default free plan assigned to all new users on registration',
        },

        // MONTHLY PLAN $5 - 100K tokens or 5 questions, no voice
        {
          name: 'Monthly Basic - $5',
          description: '100K tokens or 5 questions per month',
          type: PlanType.BASIC,
          tokenBalance: 100000,
          dailyTokenLimit: 5000,
          monthlyTokenLimit: 100000,
          perRequestTokenLimit: 5000,
          chatMessageLimit: null, // Unlimited chat messages
          questionLimit: 5,
          voiceConversationEnabled: false,
          price: 5,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'Basic monthly plan - $5',
        },

        // MONTHLY PLAN $10 - 200K tokens or 10 questions
        {
          name: 'Monthly Standard - $10',
          description: '200K tokens or 10 questions per month',
          type: PlanType.STANDARD,
          tokenBalance: 200000,
          dailyTokenLimit: 10000,
          monthlyTokenLimit: 200000,
          perRequestTokenLimit: 10000,
          chatMessageLimit: null,
          questionLimit: 10,
          voiceConversationEnabled: false,
          price: 10,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'Standard monthly plan - $10',
        },

        // MONTHLY PLAN $20 - 500K tokens or 30 questions
        {
          name: 'Monthly Premium - $20',
          description: '500K tokens or 30 questions per month',
          type: PlanType.PREMIUM,
          tokenBalance: 500000,
          dailyTokenLimit: 25000,
          monthlyTokenLimit: 500000,
          perRequestTokenLimit: 20000,
          chatMessageLimit: null,
          questionLimit: 30,
          voiceConversationEnabled: true, // Voice enabled
          price: 20,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'Premium monthly plan - $20 with voice conversation',
        },

        // CHAT CREDIT $5 - 200K tokens or 8 questions
        {
          name: 'Chat Credit - $5',
          description: '200K tokens or 8 questions - one-time credit',
          type: PlanType.BASIC,
          tokenBalance: 200000,
          dailyTokenLimit: 10000,
          monthlyTokenLimit: 200000,
          perRequestTokenLimit: 8000,
          chatMessageLimit: null,
          questionLimit: 8,
          voiceConversationEnabled: false,
          price: 5,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'One-time chat credit - $5',
        },

        // CHAT CREDIT $10 - 500K tokens or 20 questions
        {
          name: 'Chat Credit - $10',
          description: '500K tokens or 20 questions - one-time credit',
          type: PlanType.STANDARD,
          tokenBalance: 500000,
          dailyTokenLimit: 20000,
          monthlyTokenLimit: 500000,
          perRequestTokenLimit: 15000,
          chatMessageLimit: null,
          questionLimit: 20,
          voiceConversationEnabled: false,
          price: 10,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'One-time chat credit - $10',
        },

        // CHAT CREDIT $30 - Unlimited tokens or 100 questions
        {
          name: 'Chat Credit - $30',
          description: 'Unlimited tokens or 100 questions - one-time credit',
          type: PlanType.ENTERPRISE,
          tokenBalance: 999999999, // Virtually unlimited
          dailyTokenLimit: 100000,
          monthlyTokenLimit: 999999999,
          perRequestTokenLimit: 50000,
          chatMessageLimit: null,
          questionLimit: 100,
          voiceConversationEnabled: true,
          price: 30,
          currency: 'USD',
          isActive: true,
          isTokenTrackingEnabled: true,
          notes: 'One-time chat credit - $30 with unlimited tokens',
        },
      ];

      await this.planModel.insertMany(plans);
      this.logger.log('✅ Successfully seeded all plans (Free, Monthly, and Chat Credits)');
    } catch (error) {
      this.logger.error('Error seeding plans:', error);
      throw error;
    }
  }
}
