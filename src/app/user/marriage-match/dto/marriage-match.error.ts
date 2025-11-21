// filepath: /home/user/parag/boiler/boiler-plates/nest+fastify/src/app/user/marriage-match/dto/marriage-match.error.ts
import { HttpStatus } from '@nestjs/common';
import { CommonException } from '@utils/exception';
import { marriageMatchResponse } from '@utils/constant/marriage-match.constant';

export class MarriageMatchNotFoundException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.matchNotFound, HttpStatus.NOT_FOUND);
  }
}

export class MarriageMatchAccessDeniedException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.accessDenied, HttpStatus.FORBIDDEN);
  }
}

export class MarriageMatchUserNotFoundException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.userNotFound, HttpStatus.NOT_FOUND);
  }
}

export class MarriageMatchIncompleteProfileException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.incompleteProfile, HttpStatus.BAD_REQUEST);
  }
}

export class MarriageMatchParsingException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.parsingFailed, HttpStatus.BAD_REQUEST);
  }
}

export class MarriageMatchInvalidDataException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.invalidData, HttpStatus.BAD_REQUEST);
  }
}

export class MarriageMatchPartnerNotFoundException extends CommonException {
  constructor(message?: string) {
    super(message || marriageMatchResponse.partnerNotFound, HttpStatus.NOT_FOUND);
  }
}
