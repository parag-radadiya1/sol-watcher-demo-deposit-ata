import { Injectable } from '@nestjs/common';
import { MarriageMatchModelService } from '@entities-marriage-match/marriage-match.service';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import {
  CreateMarriageMatchDto,
  UpdateMarriageMatchDto,
  GetMarriageMatchesQueryDto,
} from './dto/marriage-match.dto';
import { CheckMarriageMatchDto } from './dto/check-marriage-match.dto';
import { MarriageMatch } from '@entities-marriage-match/marriage-match.entities';
import {
  MARRIAGE_MATCH_SYSTEM_PROMPT,
  MARRIAGE_MATCH_USER_PROMPT_TEMPLATE,
} from './constants/marriage-match-prompt.constant';
import { ToonParser } from '@app/user/astrology/utils/toon-parser.util';
import * as crypto from 'crypto';
import { TokenUsageType } from '@entities/langchain-token-usage/langchain-token-usage.entities';
import {
  IMarriageMatchResponse,
  IMarriageMatchesListResponse,
  IMarriageMatchDetailResponse,
} from './dto/marriage-match.interface';
import {
  MarriageMatchNotFoundException,
  MarriageMatchAccessDeniedException,
  MarriageMatchUserNotFoundException,
  MarriageMatchIncompleteProfileException,
  MarriageMatchParsingException,
  MarriageMatchInvalidDataException,
  MarriageMatchPartnerNotFoundException,
} from './dto/marriage-match.error';
import { marriageMatchResponse } from '@utils/constant/marriage-match.constant';

@Injectable()
export class MarriageMatchService {
  constructor(
    private readonly marriageMatchModelService: MarriageMatchModelService,
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
  ) {}

  /**
   * @description Helper method to format birth date
   * @param {Date} birthDate - Date to format
   * @returns {string} Formatted birth date string
   */
  private formatBirthDate(birthDate: Date): string {
    return new Date(birthDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }

  /**
   * @description Generate a hash of partner details for caching
   * Creates a unique identifier based on partner's name, birthDate, birthTime, and birthPlace
   * @param {CheckMarriageMatchDto} partnerData - Partner details
   * @returns {string} Hash of partner details
   */
  private generatePartnerDetailsHash(partnerData: CheckMarriageMatchDto): string {
    const partnerKey = `${partnerData.name}|${new Date(partnerData.birthDate).toISOString()}|${partnerData.birthTime}|${partnerData.birthPlace}`;
    return crypto.createHash('sha256').update(partnerKey).digest('hex');
  }

  /**
   * @description Find existing match with same partner details
   * @param {string} userId - Current user ID
   * @param {string} detailsHash - Hash of partner details
   * @returns {Promise<MarriageMatch | null>} Existing match or null
   */
  private async findExistingMatchByHash(
    userId: string,
    detailsHash: string,
  ): Promise<MarriageMatch | null> {
    // Query by userId and partnerDetailsHash
    const match = await this.marriageMatchModelService.getMatchByDetailsHash(
      userId,
      detailsHash,
    );
    return match;
  }

  /**
   * @description Generate marriage match compatibility by calling LangChain directly
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {CheckMarriageMatchDto} data - Partner birth details
   * @returns {Promise<ICommonResponse<IMarriageMatchResponse>>} Generated match record with compatibility score
   */
  async checkMarriageMatch(
    req: IAuthGuardResponse,
    data: CheckMarriageMatchDto,
  ): Promise<ICommonResponse<IMarriageMatchResponse>> {
    console.log('=== Starting checkMarriageMatch ===', { userId: req.userId, partnerName: data.name });

    // Generate hash of partner details for caching
    const partnerDetailsHash = this.generatePartnerDetailsHash(data);
    console.log('=== Partner details hash generated ===', partnerDetailsHash);

    // Check if match with same partner details already exists
    const existingMatch = await this.findExistingMatchByHash(
      req.userId,
      partnerDetailsHash,
    );

    if (existingMatch) {
      console.log('=== Found existing match with same partner details ===', {
        matchId: existingMatch._id,
        createdAt: existingMatch.createdAt,
      });

      // Return cached match from database
      return {
        statusCode: 200,
        message: marriageMatchResponse.compatibilityRetrievedFromCache,
        data: {
          matchId: existingMatch._id.toString(),
          partners: existingMatch.partners,
          synastry: existingMatch.synastry,
          compositeChart: existingMatch.compositeChart,
          scores: existingMatch.scores,
          finalSummary: existingMatch.finalSummary,
          createdAt: new Date(existingMatch.createdAt),
          cached: true,
          cacheSource: 'database',
        },
      };
    }

    console.log('=== No existing match found, fetching from LangChain ===');

    // Get current user from database
    const currentUser = await this.userModelService.getUserById(req.userId);

    if (!currentUser) {
      throw new MarriageMatchUserNotFoundException();
    }

    // Validate current user has birth details
    if (!currentUser.birthDate || !currentUser.birthPlace) {
      throw new MarriageMatchIncompleteProfileException();
    }

    // Determine current user's gender (default to 'male')
    const currentUserGender = (currentUser.gender || 'male').toLowerCase();
    const partnerGender = currentUserGender === 'male' ? 'female' : 'male';

    // Format current user's full name
    const currentUserFullName = currentUser.middleName
      ? `${currentUser.firstName} ${currentUser.lastName} ${currentUser.middleName}`.trim()
      : `${currentUser.firstName} ${currentUser.lastName}`.trim();

    // Format birth dates using helper method
    const currentUserBirthDateFormatted = this.formatBirthDate(currentUser.birthDate);
    const partnerBirthDateFormatted = this.formatBirthDate(data.birthDate);

    // Build the user prompt with actual data using dynamic placeholders
    const userPrompt = MARRIAGE_MATCH_USER_PROMPT_TEMPLATE
      .replace(/{boyName}/g, currentUserFullName)
      .replace(/{boyBirthDate}/g, currentUserBirthDateFormatted)
      .replace(/{boyBirthTime}/g, '12:00') // Default if not available
      .replace(/{boyBirthPlace}/g, currentUser.birthPlace)
      .replace(/{boyGender}/g, currentUserGender)
      .replace(/{girlName}/g, data.name)
      .replace(/{girlBirthDate}/g, partnerBirthDateFormatted)
      .replace(/{girlBirthTime}/g, data.birthTime)
      .replace(/{girlBirthPlace}/g, data.birthPlace)
      .replace(/{girlGender}/g, partnerGender);

    console.log('=== Starting AI marriage match analysis ===');

    // Call LangChain service directly to get TOON response
    console.log('=== AI response received ===');

    const trackingResult = await this.langChainService.chatWithContextAndTracking(
      currentUser._id,
      MARRIAGE_MATCH_SYSTEM_PROMPT,
      userPrompt,
      currentUser.planId,
      TokenUsageType.MARRIAGE_MATCH
    );

    const aiResponse = trackingResult.response;
    console.log('Response length:', aiResponse.length, 'characters');

    // Parse TOON response to JSON
    let parsedMatch: any;
    try {
      parsedMatch = ToonParser.parse(aiResponse);
      console.log('=== Successfully parsed TOON format ===');
    } catch (parseError) {
      console.error('Failed to parse TOON format:', parseError);
      throw new MarriageMatchParsingException();
    }

    // Validate and sanitize parsed match data
    if (!parsedMatch.partners || !parsedMatch.synastry || !parsedMatch.compositeChart || !parsedMatch.scores || !parsedMatch.finalSummary) {
      console.error('Invalid parsed match structure:', parsedMatch);
      throw new MarriageMatchInvalidDataException();
    }

    // Sanitize numeric values in scores
    parsedMatch.scores = {
      love: this.forceToNumber(parsedMatch.scores.love),
      emotion: this.forceToNumber(parsedMatch.scores.emotion),
      communication: this.forceToNumber(parsedMatch.scores.communication),
      sexuality: this.forceToNumber(parsedMatch.scores.sexuality),
      overall: this.forceToNumber(parsedMatch.scores.overall),
    };

    // Create match record in database with partner details hash for future caching
    const matchRecord = await this.marriageMatchModelService.createMatch({
      userId: req.userId,
      partners: parsedMatch.partners,
      synastry: parsedMatch.synastry,
      compositeChart: parsedMatch.compositeChart,
      scores: parsedMatch.scores,
      finalSummary: parsedMatch.finalSummary,
      source: 'ai_generated',
      partnerId: null,
      partnerDetailsHash, // Store hash for future lookups
      toonMessage: aiResponse, // Store raw TOON message
    });

    console.log('=== Match record saved to database ===');

    // Return JSON response (not TOON)
    return {
      statusCode: 201,
      message: marriageMatchResponse.compatibilityAnalysisCompleted,
      data: {
        matchId: matchRecord._id.toString(),
        partners: parsedMatch.partners,
        synastry: parsedMatch.synastry,
        compositeChart: parsedMatch.compositeChart,
        scores: parsedMatch.scores,
        finalSummary: parsedMatch.finalSummary,
        createdAt: new Date(matchRecord.createdAt),
        cached: false,
        cacheSource: 'langchain',
      },
    };
  }

  /**
   * @description Get a specific marriage match by ID
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} matchId - Match ID to retrieve
   * @returns {Promise<ICommonResponse<IMarriageMatchDetailResponse>>} Match record
   */
  async getMatchById(
    req: IAuthGuardResponse,
    matchId: string,
  ): Promise<ICommonResponse<IMarriageMatchDetailResponse>> {
    const match = await this.marriageMatchModelService.getMatchById(matchId);

    if (!match) {
      throw new MarriageMatchNotFoundException();
    }

    // Verify ownership
    if (match.userId.toString() !== req.userId) {
      throw new MarriageMatchAccessDeniedException();
    }

    // Convert dates to Date objects
    return {
      statusCode: 200,
      message: marriageMatchResponse.matchRetrievedSuccessfully,
      data: {
        ...match,
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt),
      },
    };
  }

  /**
   * @description Get all marriage matches for the authenticated user
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {GetMarriageMatchesQueryDto} query - Query parameters
   * @returns {Promise<ICommonResponse<IMarriageMatchesListResponse>>} Array of match records
   */
  async getMyMatches(
    req: IAuthGuardResponse,
    query: GetMarriageMatchesQueryDto,
  ): Promise<ICommonResponse<IMarriageMatchesListResponse>> {
    const limit = query.limit || 50;
    const minCompatibility = query.minCompatibility || 0;

    let matches;

    if (query.sortBy === 'compatibility') {
      matches = await this.marriageMatchModelService.getMatchesByCompatibility(
        req.userId,
        limit,
      );
    } else if (query.sortBy === 'best') {
      matches = await this.marriageMatchModelService.getBestMatches(
        req.userId,
        limit,
      );
    } else {
      matches = await this.marriageMatchModelService.getUserMatches(
        req.userId,
        limit,
      );
    }

    // Filter by minimum compatibility if specified (using new scores.overall field)
    if (minCompatibility > 0) {
      matches = matches.filter(
        (m) => m.scores.overall >= minCompatibility,
      );
    }

    return {
      statusCode: 200,
      message: marriageMatchResponse.matchesRetrievedSuccessfully,
      data: {
        total: matches.length,
        matches,
      },
    };
  }

  /**
   * @description Delete/archive a marriage match record
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} matchId - Match ID to delete
   * @returns {Promise<ICommonResponse<{ deleted: boolean }>>} Success response
   */
  async deleteMatch(
    req: IAuthGuardResponse,
    matchId: string,
  ): Promise<ICommonResponse<{ deleted: boolean }>> {
    const success = await this.marriageMatchModelService.deleteMatch(
      matchId,
      req.userId,
    );

    if (!success) {
      throw new MarriageMatchNotFoundException();
    }

    return {
      statusCode: 200,
      message: marriageMatchResponse.matchDeletedSuccessfully,
      data: { deleted: true },
    };
  }

  /**
   * @description Get match between two users (if exists)
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} partnerId - Partner user ID
   * @returns {Promise<ICommonResponse<MarriageMatch>>} Match record or null
   */
  async getMatchWithPartner(
    req: IAuthGuardResponse,
    partnerId: string,
  ): Promise<ICommonResponse<MarriageMatch>> {
    const match = await this.marriageMatchModelService.getMatchBetweenUsers(
      req.userId,
      partnerId,
    );

    if (!match) {
      throw new MarriageMatchPartnerNotFoundException();
    }

    return {
      statusCode: 200,
      message: marriageMatchResponse.matchBetweenPartnersRetrieved,
      data: match,
    };
  }

  /**
   * @description Force a value to be a number, with fallback to 0
   * Handles string numbers, invalid values, and edge cases
   * @param {any} value - Value to convert
   * @returns {number} Converted number or 0
   */
  private forceToNumber(value: any): number {
    // If already a number, return it
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    // Try to parse as number
    const parsed = Number(value);
    if (!isNaN(parsed)) {
      return parsed;
    }

    // Default to 0 for invalid values
    console.warn(`Invalid numeric value encountered: ${value}, defaulting to 0`);
    return 0;
  }
}
