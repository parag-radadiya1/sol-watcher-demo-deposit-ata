import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { DailyAstrologySuccess } from '../doc';
import { commonResponse } from '@utils/constant';

export class DailyAstrologyPredictionsSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  commonResponse.success,
  DailyAstrologySuccess,
) {}
