import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanType } from './plan.entities';

export interface ICreatePlanDto {
  name: string;
  description?: string;
  type: PlanType;
  tokenBalance: number;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  perRequestTokenLimit: number;
  price?: number;
  currency?: string;
  isActive?: boolean;
  isTokenTrackingEnabled?: boolean;
  notes?: string;
}

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(Plan.name)
    private planModel: Model<Plan>,
  ) {}

  /**
   * Create a new plan
   */
  async createPlan(dto: ICreatePlanDto): Promise<Plan> {
    const plan = new this.planModel({
      ...dto,
      isActive: dto.isActive ?? true,
      isTokenTrackingEnabled: dto.isTokenTrackingEnabled ?? true,
    });
    return await plan.save();
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<Plan> {
    const plan = await this.planModel.findById(planId).lean();
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    return plan;
  }

  /**
   * Get plan by type
   */
  async getPlanByType(type: PlanType): Promise<Plan> {
    const plan = await this.planModel.findOne({ type, isActive: true });
    if (!plan) {
      throw new NotFoundException(`Active plan of type ${type} not found`);
    }
    return plan;
  }

  /**
   * Get all active plans
   */
  async getAllActivePlans(): Promise<Plan[]> {
    return await this.planModel.find({ isActive: true }).sort({ price: 1 });
  }

  /**
   * Get all plans
   */
  async getAllPlans(): Promise<Plan[]> {
    return await this.planModel.find().sort({ type: 1 });
  }

  /**
   * Update a plan
   */
  async updatePlan(planId: string, dto: Partial<ICreatePlanDto>): Promise<Plan> {
    const plan = await this.planModel.findByIdAndUpdate(planId, dto, { new: true });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    return plan;
  }

  /**
   * Increment user count for a plan
   */
  async incrementUserCount(planId: string): Promise<Plan> {
    const plan = await this.planModel.findByIdAndUpdate(
      planId,
      { $inc: { userCount: 1 } },
      { new: true },
    );
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    return plan;
  }

  /**
   * Decrement user count for a plan
   */
  async decrementUserCount(planId: string): Promise<Plan> {
    const plan = await this.planModel.findByIdAndUpdate(
      planId,
      { $inc: { userCount: -1 } },
      { new: true },
    );
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    return plan;
  }

  /**
   * Delete a plan
   */
  async deletePlan(planId: string): Promise<void> {
    const result = await this.planModel.findByIdAndDelete(planId);
    if (!result) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
  }

  /**
   * Get default plan (Basic)
   */
  async getDefaultPlan(): Promise<Plan> {
    return await this.getPlanByType(PlanType.BASIC);
  }

  /**
   * Get free plan for new users
   */
  async getFreePlan(): Promise<Plan> {
    const plan = await this.planModel.findOne({ type: PlanType.FREE, isActive: true });
    if (!plan) {
      throw new NotFoundException('Free plan not found. Please run the plan seeder.');
    }
    return plan;
  }
}
