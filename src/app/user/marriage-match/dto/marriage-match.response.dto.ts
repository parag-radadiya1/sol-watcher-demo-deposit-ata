// filepath: /home/user/parag/boiler/boiler-plates/nest+fastify/src/app/user/marriage-match/dto/marriage-match.response.dto.ts
import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { IMarriageMatchResponse, IMarriageMatchesListResponse } from './marriage-match.interface';

export class CheckMarriageMatchSuccessResponse extends SwaggerResponse(
  HttpStatus.CREATED,
  'Marriage match compatibility analysis completed successfully',
  {} as IMarriageMatchResponse,
) {}

export class GetMarriageMatchSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Marriage match retrieved successfully',
  {} as IMarriageMatchResponse,
) {}

export class GetMarriageMatchesListSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Marriage matches retrieved successfully',
  {} as IMarriageMatchesListResponse,
) {}

export class GetMarriageMatchDetailSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Marriage match retrieved successfully',
  {} as IMarriageMatchResponse,
) {}

export class GetPartnerMatchSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Match between partners retrieved successfully',
  {} as IMarriageMatchResponse,
) {}

export class DeleteMarriageMatchSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Marriage match deleted successfully',
  { deleted: true },
) {}
