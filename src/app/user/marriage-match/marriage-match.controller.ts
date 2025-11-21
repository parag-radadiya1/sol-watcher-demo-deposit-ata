import {
  Controller,
  Post,
  Get,
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
import {
  CheckMarriageMatchSuccessResponse,
  GetMarriageMatchSuccessResponse,
  GetMarriageMatchesListSuccessResponse,
  GetMarriageMatchDetailSuccessResponse,
  GetPartnerMatchSuccessResponse,
  DeleteMarriageMatchSuccessResponse,
} from './dto/marriage-match.response.dto';
import { MarriageMatch } from '@entities-marriage-match/marriage-match.entities';
import {
  IMarriageMatchResponse,
  IMarriageMatchesListResponse,
  IMarriageMatchDetailResponse,
} from './dto/marriage-match.interface';

@ApiTags('Marriage Match')
@Controller('user/marriage-match')
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
    type: CheckMarriageMatchSuccessResponse,
  })
  async checkMarriageMatch(
    @Req() req: IAuthGuardResponse,
    @Body() data: CheckMarriageMatchDto,
  ): Promise<ICommonResponse<IMarriageMatchResponse>> {
    return this.marriageMatchService.checkMarriageMatch(req, data);
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
    type: GetMarriageMatchDetailSuccessResponse,
  })
  async getMatch(
    @Req() req: IAuthGuardResponse,
    @Param('matchId') matchId: string,
  ): Promise<ICommonResponse<IMarriageMatchDetailResponse>> {
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
    type: GetMarriageMatchesListSuccessResponse,
  })
  async getMyMatches(
    @Req() req: IAuthGuardResponse,
    @Query() query: GetMarriageMatchesQueryDto,
  ): Promise<ICommonResponse<IMarriageMatchesListResponse>> {
    return this.marriageMatchService.getMyMatches(req, query);
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
  ): Promise<ICommonResponse<MarriageMatch>> {
    return this.marriageMatchService.getMatchWithPartner(req, partnerId);
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
    type: DeleteMarriageMatchSuccessResponse,
  })
  async deleteMatch(
    @Req() req: IAuthGuardResponse,
    @Param('matchId') matchId: string,
  ): Promise<ICommonResponse<{ deleted: boolean }>> {
    return this.marriageMatchService.deleteMatch(req, matchId);
  }
}
