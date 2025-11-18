import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { MarriageMatchService } from './marriage-match.service';
import {
  CreateMarriageMatchDto,
  UpdateMarriageMatchDto,
  GetMarriageMatchesQueryDto,
} from './dto/marriage-match.dto';
import { CheckMarriageMatchDto } from './dto/check-marriage-match.dto';
import { AuthGuard } from '@guard/auth.guard';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';

@ApiTags('Marriage Match')
@Controller('marriage-match')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MarriageMatchController {
  constructor(private readonly marriageMatchService: MarriageMatchService) {}

  /**
   * @description Check marriage compatibility - AI generated analysis
   * Only requires partner's birth details. Current user is fetched from auth token.
   * @param req Authenticated user request
   * @param data Partner birth details (name, birth date, birth time, birth place)
   * @returns Generated match analysis with compatibility percentage
   */
  @Post('check')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Marriage match compatibility analysis generated successfully',
  })
  async checkMarriageMatch(
    @Req() req: IAuthGuardResponse,
    @Body() data: CheckMarriageMatchDto,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.checkMarriageMatch(req, data);
  }

  /**
   * @description Create a new marriage match record (manual entry)
   * @param req Authenticated user request
   * @param data Marriage match data
   * @returns Created match record
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Marriage match record created successfully',
  })
  async createMatch(
    @Req() req: IAuthGuardResponse,
    @Body() data: CreateMarriageMatchDto,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.createMatch(req, data);
  }

  /**
   * @description Get a specific marriage match by ID
   * @param req Authenticated user request
   * @param matchId Match ID
   * @returns Match record
   */
  @Get(':matchId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Marriage match retrieved successfully',
  })
  async getMatch(
    @Req() req: IAuthGuardResponse,
    @Param('matchId') matchId: string,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getMatchById(req, matchId);
  }

  /**
   * @description Get all marriage matches for the current user
   * @param req Authenticated user request
   * @param query Query parameters for filtering and sorting
   * @returns Array of match records
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Marriage matches retrieved successfully',
  })
  async getMyMatches(
    @Req() req: IAuthGuardResponse,
    @Query() query: GetMarriageMatchesQueryDto,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getMyMatches(req, query);
  }

  /**
   * @description Get high compatibility matches (above 60%)
   * @param req Authenticated user request
   * @returns Array of high compatibility matches
   */
  @Get('filters/high-compatibility')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'High compatibility matches retrieved successfully',
  })
  async getHighCompatibilityMatches(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getHighCompatibilityMatches(req);
  }

  /**
   * @description Get match statistics for the current user
   * @param req Authenticated user request
   * @returns Match statistics
   */
  @Get('stats/overview')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Match statistics retrieved successfully',
  })
  async getMatchStatistics(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getMatchStatistics(req);
  }

  /**
   * @description Get all matches with mangal dosha issues
   * @param req Authenticated user request
   * @returns Array of matches with mangal dosha
   */
  @Get('filters/mangal-dosha')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Matches with mangal dosha retrieved successfully',
  })
  async getMatchesWithMangalDosha(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getMatchesWithMangalDosha(req);
  }

  /**
   * @description Get match between current user and a specific partner
   * @param req Authenticated user request
   * @param partnerId Partner user ID
   * @returns Match record between users
   */
  @Get('partner/:partnerId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Match with partner retrieved successfully',
  })
  async getMatchWithPartner(
    @Req() req: IAuthGuardResponse,
    @Param('partnerId') partnerId: string,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.getMatchWithPartner(req, partnerId);
  }

  /**
   * @description Update a marriage match record
   * @param req Authenticated user request
   * @param matchId Match ID to update
   * @param data Updated match data
   * @returns Updated match record
   */
  @Put(':matchId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Marriage match updated successfully',
  })
  async updateMatch(
    @Req() req: IAuthGuardResponse,
    @Param('matchId') matchId: string,
    @Body() data: UpdateMarriageMatchDto,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.updateMatch(req, matchId, data);
  }

  /**
   * @description Delete/archive a marriage match record
   * @param req Authenticated user request
   * @param matchId Match ID to delete
   * @returns Success response
   */
  @Delete(':matchId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Marriage match deleted successfully',
  })
  async deleteMatch(
    @Req() req: IAuthGuardResponse,
    @Param('matchId') matchId: string,
  ): Promise<ICommonResponse<any>> {
    return this.marriageMatchService.deleteMatch(req, matchId);
  }
}
