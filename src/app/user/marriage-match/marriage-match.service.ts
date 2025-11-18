import { Injectable, HttpStatus } from '@nestjs/common';
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
   * @returns {Promise<ICommonResponse<any>>} Generated match record with compatibility score
   */
  async checkMarriageMatch(
    req: IAuthGuardResponse,
    data: CheckMarriageMatchDto,
  ): Promise<ICommonResponse<any>> {
    try {
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
          statusCode: HttpStatus.OK,
          message: 'Marriage match compatibility retrieved from cache (same partner details)',
          data: {
            matchId: existingMatch._id,
            partners: existingMatch.partners,
            synastry: existingMatch.synastry,
            compositeChart: existingMatch.compositeChart,
            scores: existingMatch.scores,
            finalSummary: existingMatch.finalSummary,
            createdAt: existingMatch.createdAt,
            cached: true,
            cacheSource: 'database',
          },
        };
      }

      console.log('=== No existing match found, fetching from LangChain ===');

      // Get current user from database
      const currentUser = await this.userModelService.getUserById(req.userId);

      if (!currentUser) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Current user not found',
          data: null,
        };
      }

      // Validate current user has birth details
      if (!currentUser.birthDate || !currentUser.birthPlace) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Your birth details are incomplete. Please update your profile with birth date and place.',
          data: null,
        };
      }

      // Determine current user's gender (default to 'male')
      const currentUserGender = (currentUser.gender || 'male').toLowerCase();
      const partnerGender = currentUserGender === 'male' ? 'female' : 'male';

      // Format current user's full name
      const currentUserFullName = currentUser.surname
        ? `${currentUser.firstName} ${currentUser.lastName} ${currentUser.surname}`.trim()
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
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to parse AI response. Please try again.',
          data: null,
        };
      }

      // Validate and sanitize parsed match data
      if (!parsedMatch.partners || !parsedMatch.synastry || !parsedMatch.compositeChart || !parsedMatch.scores || !parsedMatch.finalSummary) {
        console.error('Invalid parsed match structure:', parsedMatch);
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'AI response is missing required fields. Please try again.',
          data: null,
        };
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
        statusCode: HttpStatus.CREATED,
        message: 'Marriage match compatibility analysis completed successfully',
        data: {
          matchId: matchRecord._id,
          partners: parsedMatch.partners,
          synastry: parsedMatch.synastry,
          compositeChart: parsedMatch.compositeChart,
          scores: parsedMatch.scores,
          finalSummary: parsedMatch.finalSummary,
          createdAt: matchRecord.createdAt,
          cached: false,
          cacheSource: 'langchain',
        },
      };
    } catch (error) {
      console.error('Marriage match error:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to generate marriage match compatibility',
        data: null,
      };
    }
  }

  /**
   * @description Create a new marriage match record (manual entry)
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {CreateMarriageMatchDto} data - Match data from user input
   * @returns {Promise<ICommonResponse<any>>} Created match record
   */
  async createMatch(
    req: IAuthGuardResponse,
    data: CreateMarriageMatchDto,
  ): Promise<ICommonResponse<any>> {
    try {
      const match = await this.marriageMatchModelService.createMatch({
        userId: req.userId,
        partners: data.partners,
        synastry: data.synastry,
        compositeChart: data.compositeChart,
        scores: data.scores,
        finalSummary: data.finalSummary,
        source: data.source || 'user_input',
        partnerId: data.partnerId || null,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Marriage match record created successfully',
        data: match,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to create marriage match record',
        data: null,
      };
    }
  }

  /**
   * @description Get a specific marriage match by ID
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} matchId - Match ID to retrieve
   * @returns {Promise<ICommonResponse<MarriageMatch>>} Match record or null
   */
  async getMatchById(
    req: IAuthGuardResponse,
    matchId: string,
  ): Promise<ICommonResponse<MarriageMatch | null>> {
    try {
      const match = await this.marriageMatchModelService.getMatchById(matchId);

      if (!match) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Marriage match not found',
          data: null,
        };
      }

      // Verify ownership
      if (match.userId.toString() !== req.userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have access to this match record',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Marriage match retrieved successfully',
        data: match,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve marriage match',
        data: null,
      };
    }
  }

  /**
   * @description Get all marriage matches for the authenticated user
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {GetMarriageMatchesQueryDto} query - Query parameters
   * @returns {Promise<ICommonResponse<any>>} Array of match records
   */
  async getMyMatches(
    req: IAuthGuardResponse,
    query: GetMarriageMatchesQueryDto,
  ): Promise<ICommonResponse<any>> {
    try {
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
        statusCode: HttpStatus.OK,
        message: 'Marriage matches retrieved successfully',
        data: {
          total: matches.length,
          matches,
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve marriage matches',
        data: null,
      };
    }
  }

  /**
   * @description Get high compatibility matches (above 60%)
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @returns {Promise<ICommonResponse<any>>} Array of high compatibility matches
   */
  async getHighCompatibilityMatches(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    try {
      const matches = await this.marriageMatchModelService.getHighCompatibilityMatches(
        req.userId,
        60,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'High compatibility matches retrieved successfully',
        data: {
          total: matches.length,
          threshold: 60,
          matches,
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve high compatibility matches',
        data: null,
      };
    }
  }

  /**
   * @description Get match statistics for the user
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @returns {Promise<ICommonResponse<any>>} Match statistics
   */
  async getMatchStatistics(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    try {
      const stats = await this.marriageMatchModelService.getMatchStatistics(
        req.userId,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Match statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve match statistics',
        data: null,
      };
    }
  }

  /**
   * @description Update a marriage match record
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} matchId - Match ID to update
   * @param {UpdateMarriageMatchDto} data - Updated data
   * @returns {Promise<ICommonResponse<MarriageMatch>>} Updated match record
   */
  async updateMatch(
    req: IAuthGuardResponse,
    matchId: string,
    data: UpdateMarriageMatchDto,
  ): Promise<ICommonResponse<MarriageMatch | null>> {
    try {
      const match = await this.marriageMatchModelService.updateMatch(
        matchId,
        req.userId,
        data,
      );

      if (!match) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Marriage match not found or you do not have access',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Marriage match updated successfully',
        data: match,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to update marriage match',
        data: null,
      };
    }
  }

  /**
   * @description Delete/archive a marriage match record
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @param {string} matchId - Match ID to delete
   * @returns {Promise<ICommonResponse<any>>} Success/failure response
   */
  async deleteMatch(
    req: IAuthGuardResponse,
    matchId: string,
  ): Promise<ICommonResponse<any>> {
    try {
      const success = await this.marriageMatchModelService.deleteMatch(
        matchId,
        req.userId,
      );

      if (!success) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Marriage match not found or you do not have access',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Marriage match deleted successfully',
        data: { deleted: true },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to delete marriage match',
        data: null,
      };
    }
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
  ): Promise<ICommonResponse<MarriageMatch | null>> {
    try {
      const match = await this.marriageMatchModelService.getMatchBetweenUsers(
        req.userId,
        partnerId,
      );

      if (!match) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No match found between you and this partner',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Match between partners retrieved successfully',
        data: match,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve partner match',
        data: null,
      };
    }
  }

  /**
   * @description Get all matches with mangal dosha issues
   * @param {IAuthGuardResponse} req - Authenticated user request
   * @returns {Promise<ICommonResponse<any>>} Array of matches with mangal dosha
   */
  async getMatchesWithMangalDosha(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    try {
      const matches = await this.marriageMatchModelService.getMatchesWithMangalDosha(
        req.userId,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Matches with mangal dosha retrieved successfully',
        data: {
          total: matches.length,
          matches,
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to retrieve matches with mangal dosha',
        data: null,
      };
    }
  }

  /**
   * @description Sanitize and validate marriage match data from AI
   * Ensures all numeric fields are properly converted to numbers
   * @param {any} parsedMatch - Parsed match data from AI
   * @returns {any} Sanitized match data
   */
  private sanitizeMatchData(parsedMatch: any): any {
    if (!parsedMatch) return parsedMatch;

    // Sanitize ashtakootPoints attributes
    if (
      parsedMatch.ashtakootPoints &&
      Array.isArray(parsedMatch.ashtakootPoints.attributes)
    ) {
      parsedMatch.ashtakootPoints.attributes = parsedMatch.ashtakootPoints.attributes.map(
        (attr: any) => ({
          attribute: attr.attribute,
          description: attr.description,
          male: this.forceToNumber(attr.male),
          female: this.forceToNumber(attr.female),
          max: this.forceToNumber(attr.max),
          received: this.forceToNumber(attr.received),
        }),
      );
    }

    // Sanitize totalMale and totalReceived
    if (parsedMatch.ashtakootPoints) {
      parsedMatch.ashtakootPoints.totalMale = this.forceToNumber(
        parsedMatch.ashtakootPoints.totalMale,
      );
      parsedMatch.ashtakootPoints.totalReceived = this.forceToNumber(
        parsedMatch.ashtakootPoints.totalReceived,
      );
    }

    // Sanitize matchSummary
    if (parsedMatch.matchSummary) {
      parsedMatch.matchSummary.matchPercentage = this.forceToNumber(
        parsedMatch.matchSummary.matchPercentage,
      );
      if (parsedMatch.matchSummary.matchPoints) {
        parsedMatch.matchSummary.matchPoints.received = this.forceToNumber(
          parsedMatch.matchSummary.matchPoints.received,
        );
        parsedMatch.matchSummary.matchPoints.total = this.forceToNumber(
          parsedMatch.matchSummary.matchPoints.total,
        );
      }
    }

    // Sanitize matchingReport
    if (parsedMatch.matchingReport) {
      if (parsedMatch.matchingReport.ashtakoot) {
        parsedMatch.matchingReport.ashtakoot.received = this.forceToNumber(
          parsedMatch.matchingReport.ashtakoot.received,
        );
        parsedMatch.matchingReport.ashtakoot.total = this.forceToNumber(
          parsedMatch.matchingReport.ashtakoot.total,
        );
      }
    }

    return parsedMatch;
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
