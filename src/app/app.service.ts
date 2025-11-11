import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  getHello(): { status: number } {
    return { status: HttpStatus.OK };
  }
}
