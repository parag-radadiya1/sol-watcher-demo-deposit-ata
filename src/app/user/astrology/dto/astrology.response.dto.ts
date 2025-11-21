import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { AstrologySuccess } from '../doc';
import { astrologyResponse } from '@utils/constant';

export class AstrologySuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  astrologyResponse.astrologyReadingGeneratedSuccessfully,
  AstrologySuccess,
) {}
