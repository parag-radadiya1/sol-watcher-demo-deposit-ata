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
  CheckBirthstoneDto
} from './dto/birthstone.dto';
import { BirthstoneSuccessResponse, BirthstoneReadingSuccessResponse, BirthstoneOverviewSuccessResponse } from './dto/birthstone.response.dto';
import { IBirthstoneResponse, IBirthstoneMarkdownResponse, IBirthstoneOverviewResponse } from './dto/birthstone.interface';

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
    type: BirthstoneReadingSuccessResponse,
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
    type: BirthstoneSuccessResponse,
  })
  async getMyBirthstoneMarkdown(
    @Req() req: IAuthGuardResponse,
    @Body() value: CheckBirthstoneDto,
  ): Promise<ICommonResponse<IBirthstoneMarkdownResponse>> {
    return this.birthstoneService.getMyBirthstoneMarkdown(req, value);
  }

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Birthstone overview retrieved successfully',
    type: BirthstoneOverviewSuccessResponse,
  })
  getBirthstoneOverview(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<IBirthstoneOverviewResponse>> {
    return this.birthstoneService.getBirthstoneOverview(req);
  }
}
