import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BirthstoneReading, IBirthstoneReading } from './birthstone-reading.entities';

@Injectable()
export class BirthstoneReadingModelService {
  constructor(
    @InjectModel(BirthstoneReading.name)
    private readonly birthstoneReadingModel: Model<BirthstoneReading>,
  ) {}

  /**
   * Find existing reading for a user by birth details
   */
  async findByUserAndBirthDetails(
    userId: string,
    birthDate: Date,
    birthPlace: string,
  ): Promise<BirthstoneReading | null> {
    return this.birthstoneReadingModel.findOne({
      userId,
      birthDate,
      birthPlace,
      isActive: true,
    }).sort({ createdAt: -1 });
  }

  /**
   * Create a new birthstone reading
   */
  async createReading(
    userId: string,
    fullName: string,
    birthDate: Date,
    birthPlace: string,
    reading: IBirthstoneReading,
  ): Promise<BirthstoneReading> {
    return this.birthstoneReadingModel.create({
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
  async getUserReadings(userId: string): Promise<BirthstoneReading[]> {
    return this.birthstoneReadingModel
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 });
  }

  /**
   * Delete a reading
   */
  async deleteReading(readingId: string, userId: string): Promise<boolean> {
    const result = await this.birthstoneReadingModel.updateOne(
      { _id: readingId, userId },
      { isActive: false },
    );
    return result.modifiedCount > 0;
  }
}
