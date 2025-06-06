import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { commonResponse } from './constant';

@Injectable()
export class ValidateObjectIdPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(commonResponse.invalidObjectId);
    }
    return value;
  }
}

@Injectable()
export class ValidateStringPipe implements PipeTransform<string> {
  transform(value: string): string {
    // Check if the value is a valid non-empty string
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException(commonResponse.invalidStringParam);
    }
    return value;
  }
}
