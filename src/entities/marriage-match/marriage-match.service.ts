import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarriageMatch } from './marriage-match.entities';

@Injectable()
export class MarriageMatchModelService {
  constructor(
    @InjectModel(MarriageMatch.name)
    private readonly marriageMatchModel: Model<MarriageMatch>,
  ) {}

  /**
   * Create a new marriage match record
   */
  async createMatch(data: Partial<MarriageMatch>): Promise<MarriageMatch> {
    return this.marriageMatchModel.create({
      ...data,
      isActive: true,
    });
  }

  /**
   * Find a specific match by ID
   */
  async getMatchById(matchId: string): Promise<MarriageMatch | null> {
    return this.marriageMatchModel.findById(matchId);
  }

  /**
   * Get all matches for a user
   */
  async getUserMatches(userId: string, limit = 50): Promise<MarriageMatch[]> {
    return this.marriageMatchModel
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get matches between two specific people
   */
  async getMatchBetweenUsers(userId: string, partnerId: string): Promise<MarriageMatch | null> {
    return this.marriageMatchModel.findOne({
      $or: [
        { userId, partnerId, isActive: true },
        { userId: partnerId, partnerId: userId, isActive: true },
      ],
    });
  }

  /**
   * Get high compatibility matches for a user (above threshold)
   */
  async getHighCompatibilityMatches(
    userId: string,
    threshold: number = 60,
    limit = 20,
  ): Promise<MarriageMatch[]> {
    return this.marriageMatchModel
      .find({
        userId,
        'scores.overall': { $gte: threshold },
        isActive: true,
      })
      .sort({ 'scores.overall': -1 })
      .limit(limit);
  }

  /**
   * Get matches sorted by compatibility score
   */
  async getMatchesByCompatibility(
    userId: string,
    limit = 50,
  ): Promise<MarriageMatch[]> {
    return this.marriageMatchModel
      .find({ userId, isActive: true })
      .sort({ 'scores.overall': -1 })
      .limit(limit);
  }

  /**
   * Update a match record
   */
  async updateMatch(
    matchId: string,
    userId: string,
    updates: Partial<MarriageMatch>,
  ): Promise<MarriageMatch | null> {
    return this.marriageMatchModel.findOneAndUpdate(
      { _id: matchId, userId },
      { ...updates, updatedAt: new Date() },
      { new: true },
    );
  }

  /**
   * Delete/archive a match
   */
  async deleteMatch(matchId: string, userId: string): Promise<boolean> {
    const result = await this.marriageMatchModel.updateOne(
      { _id: matchId, userId },
      { isActive: false, updatedAt: new Date() },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get match statistics for a user
   */
  async getMatchStatistics(userId: string): Promise<{
    totalMatches: number;
    averageCompatibility: number;
    highCompatibilityCount: number;
    recentMatches: number;
  }> {
    const matches = await this.marriageMatchModel.find({ userId, isActive: true });

    if (matches.length === 0) {
      return {
        totalMatches: 0,
        averageCompatibility: 0,
        highCompatibilityCount: 0,
        recentMatches: 0,
      };
    }

    const avgCompatibility =
      matches.reduce((sum, match) => sum + match.scores.overall, 0) /
      matches.length;

    const highCount = matches.filter(
      (m) => m.scores.overall >= 60,
    ).length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCount = matches.filter(
      (m) => new Date(m.createdAt) > thirtyDaysAgo,
    ).length;

    return {
      totalMatches: matches.length,
      averageCompatibility: Math.round(avgCompatibility * 10) / 10,
      highCompatibilityCount: highCount,
      recentMatches: recentCount,
    };
  }

  /**
   * Find best matches (highest compatibility score)
   */
  async getBestMatches(userId: string, limit = 10): Promise<MarriageMatch[]> {
    return this.marriageMatchModel
      .find({ userId, isActive: true })
      .sort({ 'scores.overall': -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Check if a match exists between user and partner
   */
  async matchExists(userId: string, partnerId: string): Promise<boolean> {
    const match = await this.marriageMatchModel.findOne({
      $or: [
        { userId, partnerId },
        { userId: partnerId, partnerId: userId },
      ],
    });
    return !!match;
  }

  /**
   * Get all matches with mangal dosha issues
   */
  async getMatchesWithMangalDosha(userId: string): Promise<MarriageMatch[]> {
    return this.marriageMatchModel.find({
      userId,
      isActive: true,
      $or: [
        { 'mangalDoshaReport.boyHasMangal': true },
        { 'mangalDoshaReport.girlHasMangal': true },
      ],
    });
  }

  /**
   * Find a match by partner details hash (for caching)
   * Used to check if same partner details have been checked before
   */
  async getMatchByDetailsHash(userId: string, detailsHash: string): Promise<MarriageMatch | null> {
    return this.marriageMatchModel.findOne({
      userId,
      partnerDetailsHash: detailsHash,
      isActive: true,
    });
  }

  /**
   * Bulk create matches (for batch processing)
   */
  async bulkCreateMatches(matches: Partial<MarriageMatch>[]): Promise<MarriageMatch[]> {
    const result = await this.marriageMatchModel.insertMany(
      matches.map((m) => ({
        ...m,
        isActive: true,
      })),
    );
    return result as unknown as MarriageMatch[];
  }
}
