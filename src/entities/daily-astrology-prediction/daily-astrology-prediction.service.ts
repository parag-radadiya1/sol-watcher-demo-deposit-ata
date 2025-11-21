import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyAstrologyPrediction, DayOfWeek } from './daily-astrology-prediction.entities';

@Injectable()
export class DailyAstrologyPredictionService {
  constructor(
    @InjectModel(DailyAstrologyPrediction.name)
    private dailyAstrologyPredictionModel: Model<DailyAstrologyPrediction>,
  ) {}

  /**
   * Create a new daily astrology prediction
   */
  async create(predictionData: Partial<DailyAstrologyPrediction>): Promise<DailyAstrologyPrediction> {
    const prediction = new this.dailyAstrologyPredictionModel(predictionData);
    return prediction.save();
  }

  /**
   * Find prediction by user and date
   */
  async findByUserAndDate(
    userId: string,
    predictionDate: Date,
  ): Promise<DailyAstrologyPrediction | null> {
    // Create a copy to avoid mutating the original date
    const startOfDay = new Date(predictionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(predictionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.dailyAstrologyPredictionModel.findOne({
      userId,
      predictionDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  /**
   * Find prediction by user and day of week
   */
  async findByUserAndDayOfWeek(
    userId: string,
    dayOfWeek: DayOfWeek,
  ): Promise<DailyAstrologyPrediction[]> {
    return this.dailyAstrologyPredictionModel
      .find({
        userId,
        dayOfWeek,
        isActive: true,
      })
      .sort({ predictionDate: -1 });
  }

  /**
   * Find all predictions for a user within date range
   */
  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyAstrologyPrediction[]> {
    return this.dailyAstrologyPredictionModel
      .find({
        userId,
        predictionDate: {
          $gte: startDate,
          $lte: endDate,
        },
        isActive: true,
      })
      .sort({ predictionDate: -1 });
  }

  /**
   * Get all active predictions for a user
   */
  async findByUserId(userId: string, limit: number = 30): Promise<DailyAstrologyPrediction[]> {
    return this.dailyAstrologyPredictionModel
      .find({
        userId,
        isActive: true,
      })
      .sort({ predictionDate: -1 })
      .limit(limit);
  }

  /**
   * Update a prediction
   */
  async update(
    predictionId: string,
    updateData: Partial<DailyAstrologyPrediction>,
  ): Promise<DailyAstrologyPrediction | null> {
    return this.dailyAstrologyPredictionModel.findByIdAndUpdate(predictionId, updateData, {
      new: true,
    });
  }

  /**
   * Soft delete a prediction (mark as inactive)
   */
  async softDelete(predictionId: string): Promise<DailyAstrologyPrediction | null> {
    return this.dailyAstrologyPredictionModel.findByIdAndUpdate(
      predictionId,
      { isActive: false },
      { new: true },
    );
  }

  /**
   * Hard delete a prediction
   */
  async delete(predictionId: string): Promise<any> {
    return this.dailyAstrologyPredictionModel.findByIdAndDelete(predictionId);
  }

  /**
   * Find by ID
   */
  async findById(predictionId: string): Promise<DailyAstrologyPrediction | null> {
    return this.dailyAstrologyPredictionModel.findById(predictionId);
  }

  /**
   * Get prediction count by schema version (for tracking schema evolution)
   */
  async countBySchemaVersion(schemaVersion: number): Promise<number> {
    return this.dailyAstrologyPredictionModel.countDocuments({ schemaVersion });
  }

  /**
   * Get all schema versions in use
   */
  async getSchemaVersions(): Promise<any[]> {
    return this.dailyAstrologyPredictionModel.aggregate([
      {
        $group: {
          _id: '$schemaVersion',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);
  }
}
