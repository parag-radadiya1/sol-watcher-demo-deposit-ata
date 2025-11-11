import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
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
import { AstrologyService } from './astrology.service';
import { 
  CheckAstrologyDto, 
  AstrologySuccessResponse, 
  IAstrologyResponse 
} from './dto';

@Controller('user/astrology')
@ApiTags('User-Astrology')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class AstrologyController {
  constructor(private readonly astrologyService: AstrologyService) {}

  @Post('check-my-astrology')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Astrology reading job queued successfully',
    type: AstrologySuccessResponse,
  })
  checkMyAstrology(
    @Req() req: IAuthGuardResponse,
    @Body() value: CheckAstrologyDto,
  ): Promise<ICommonResponse<IAstrologyResponse>> {
    return this.astrologyService.checkMyAstrology(req, value);
  }

  @Get('job-status/:jobId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Job status retrieved successfully',
  })
  getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<ICommonResponse<any>> {
    return this.astrologyService.getJobStatus(jobId);
  }
}
