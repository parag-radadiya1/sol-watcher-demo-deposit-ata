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
import { BirthstoneService } from './birthstone.service';
import { 
  CheckBirthstoneDto, 
  BirthstoneSuccessResponse, 
  IBirthstoneResponse 
} from './dto';

@Controller('user/birthstone')
@ApiTags('User-Birthstone')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class BirthstoneController {
  constructor(private readonly birthstoneService: BirthstoneService) {}

  @Post('get-my-birthstone')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Birthstone reading job queued successfully',
    type: BirthstoneSuccessResponse,
  })
  getMyBirthstone(
    @Req() req: IAuthGuardResponse,
    @Body() value: CheckBirthstoneDto,
  ): Promise<ICommonResponse<IBirthstoneResponse>> {
    return this.birthstoneService.getMyBirthstone(req, value);
  }

  @Post('get-my-birthstone-markdown')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Birthstone reading in markdown format retrieved successfully',
  })
  async getMyBirthstoneMarkdown(
    @Req() req: IAuthGuardResponse,
    @Body() value: CheckBirthstoneDto,
  ): Promise<ICommonResponse<any>> {
    return this.birthstoneService.getMyBirthstoneMarkdown(req, value);
  }

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Birthstone overview retrieved successfully',
  })
  getBirthstoneOverview(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    return this.birthstoneService.getBirthstoneOverview(req);
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
    return this.birthstoneService.getJobStatus(jobId);
  }
}
