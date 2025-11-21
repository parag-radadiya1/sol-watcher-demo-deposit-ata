import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestResponse,
  IAuthGuardResponse,
  ICommonResponse,
  InternalServerErrorResponse,
} from '@utils/dto';
import { commonResponse } from '@utils/constant';
import { AuthGuard } from '@guard/auth.guard';
import { DailyAstrologyService } from './daily-astrology.service';
import { DailyAstrologySuccess } from './doc';
import {
  GetDailyAstrologyPredictionDto,
  DailyAstrologyPredictionsResponseDto,
  DailyPredictionErrorResponseDto,
  DailyAstrologyPredictionsSuccessResponse,
} from './dto';

@Controller('user/daily-astrology')
@ApiTags('User-Daily-Astrology')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class DailyAstrologyController {
  constructor(private readonly dailyAstrologyService: DailyAstrologyService) {}

  /**
   * Get daily astrology predictions for a date range
   *
   * Accepts a date range (max 7 days) and returns personalized daily astrology predictions.
   * - Automatically checks if predictions exist in database
   * - Generates missing predictions using AI
   * - Combines cached and newly generated data
   *
   * Validation Rules:
   * - Date range cannot exceed 7 days
   * - Cannot predict more than 10 days in the future
   * - Cannot request predictions older than 30 days
   * - End date must be after start date
   *
   * Example: Get predictions for next 3 days
   * startDate: "2024-11-20"
   * endDate: "2024-11-22"
   */
  @Post('get-predictions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: DailyAstrologyPredictionsSuccessResponse,
    description: 'Daily astrology predictions retrieved successfully',
  })
  @ApiBadRequestResponse({
    type: DailyPredictionErrorResponseDto,
    description: 'Invalid date range or user validation failed',
  })
  async getDailyPredictions(
    @Req() req: IAuthGuardResponse,
    @Body() dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<DailyAstrologyPredictionsResponseDto>> {
      return await this.dailyAstrologyService.getDailyPredictions(req, dto);
  }

  /**
   * Get daily astrology predictions in Markdown format
   *
   * Returns predictions formatted as markdown per day (similar to wednesday_prediction.md)
   * Each prediction includes all sections like Overall Theme, Astrological Influence, etc.
   *
   * Accepts a date range (max 7 days) and returns personalized daily astrology predictions in markdown.
   * - Automatically checks if predictions exist in database
   * - Generates missing predictions using AI
   * - Combines cached and newly generated data
   * - Formats each day's prediction as beautiful markdown
   *
   * Validation Rules:
   * - Date range cannot exceed 7 days
   * - Cannot predict more than 10 days in the future
   * - Cannot request predictions older than 30 days
   * - End date must be after start date
   *
   * Example: Get markdown predictions for next 3 days
   * startDate: "2024-11-20"
   * endDate: "2024-11-22"
   */
  @Post('get-predictions-markdown')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Daily astrology predictions in markdown format retrieved successfully',
  })
  @ApiBadRequestResponse({
    type: DailyPredictionErrorResponseDto,
    description: 'Invalid date range or user validation failed',
  })
  async getDailyPredictionsMarkdown(
    @Req() req: IAuthGuardResponse,
    @Body() dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<any>> {
      return await this.dailyAstrologyService.getDailyPredictionsMarkdown(req, dto);
  }
}
