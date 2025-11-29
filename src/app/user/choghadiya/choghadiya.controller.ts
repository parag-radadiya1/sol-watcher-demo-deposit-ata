import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BadRequestResponse, IAuthGuardResponse, ICommonResponse, InternalServerErrorResponse } from '@utils/dto';
import { commonResponse } from '@utils/constant';
import { AuthGuard } from '@guard/auth.guard';
import { ChoghadiyaService } from './choghadiya.service';
import { GetChoghadiyaDto, ChoghadiyaResponseDto, ChoghadiyaSuccessResponseDto } from './dto';
import { ChoghadiyaSuccess } from './doc';

@Controller('user/choghadiya')
@ApiTags('User-Choghadiya')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class ChoghadiyaController {
  constructor(private readonly choghadiyaService: ChoghadiyaService) {}

  /**
   * Get Choghadiya for a specific date and location
   *
   * Choghadiya is a Vedic time system that divides the day and night into 8 equal periods.
   * Each period has a specific nature (auspicious, inauspicious, or neutral) and is used
   * to determine favorable times for various activities.
   *
   * This endpoint calculates:
   * - Sunrise and sunset times for the given location
   * - 8 day Choghadiya periods (from sunrise to sunset)
   * - 8 night Choghadiya periods (from sunset to next sunrise)
   * - Nature and description of each period
   *
   * @param req - Authenticated user request
   * @param dto - Contains date (optional, defaults to current date), latitude, and longitude
   * @returns Choghadiya data with day and night periods
   *
   * @example
   * Query parameters:
   * {
   *   "date": "2025-11-28",
   *   "latitude": 21.2336,
   *   "longitude": 72.8625
   * }
   */
  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: ChoghadiyaSuccessResponseDto,
    description: 'Choghadiya data retrieved successfully',
    schema: {
      example: ChoghadiyaSuccess,
    },
  })
  async getChoghadiya(
    @Req() req: IAuthGuardResponse,
    @Query() dto: GetChoghadiyaDto,
  ): Promise<ICommonResponse<ChoghadiyaResponseDto>> {
    return this.choghadiyaService.getChoghadiya(req, dto);
  }
}
