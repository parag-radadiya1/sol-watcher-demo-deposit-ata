import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AstrologyReading } from './astrology-reading.entities';
import { IAstrologyNumerologyReading } from '@app/user/astrology/interfaces';

@Injectable()
export class AstrologyReadingModelService {
  constructor(
    @InjectModel(AstrologyReading.name)
    private readonly astrologyReadingModel: Model<AstrologyReading>,
  ) {}

  /**
   * Find existing reading for a user by birth details
   */
  async findByUserAndBirthDetails(
    userId: string,
    birthDate: Date,
    birthPlace: string,
  ): Promise<AstrologyReading | null> {
    return this.astrologyReadingModel.findOne({
      userId,
      birthDate,
      birthPlace,
      isActive: true,
    }).sort({ createdAt: -1 });
  }

  /**
   * Create a new astrology reading
   */
  async createReading(
    userId: string,
    fullName: string,
    birthDate: Date,
    birthPlace: string,
    reading: IAstrologyNumerologyReading,
  ): Promise<AstrologyReading> {
    return this.astrologyReadingModel.create({
      userId,
      fullName,
      birthDate,
      birthPlace,
      reading,
      generatedAt: new Date(),
      isActive: true,
    });
  }

  /**
   * Get all readings for a user
   */
  async getUserReadings(userId: string): Promise<AstrologyReading[]> {
    return this.astrologyReadingModel
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 });
  }

  /**
   * Delete a reading
   */
  async deleteReading(readingId: string, userId: string): Promise<boolean> {
    const result = await this.astrologyReadingModel.updateOne(
      { _id: readingId, userId },
      { isActive: false },
    );
    return result.modifiedCount > 0;
  }
}

