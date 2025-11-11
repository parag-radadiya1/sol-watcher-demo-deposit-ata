import { Injectable, ValidationPipe } from '@nestjs/common';

/**
 * Service to handle custom validation of request payloads.
 */
@Injectable()
export class CustomValidationService {
  /**
   * Validates and transforms the request payload based on the provided metadata type.
   *
   * This method uses NestJS's `ValidationPipe` to:
   * - Transform incoming data to the desired type (`transform: true`).
   * - Remove properties that are not defined in the DTO (`whitelist: true`).
   *
   * @template T - The type of the data being validated.
   * @param {T} data - The request payload to validate.
   * @param {any} metatype - The metadata type (class) to validate against.
   * @returns {Promise<T>} - A promise that resolves with the validated and transformed data.
   *
   * @example
   * ```typescript
   * const validatedData = await customValidationService.validateRequestPayload(payload, MyDtoClass);
   * ```
   */
  validateRequestPayload<T>(data: T, metatype: any): Promise<T> {
    const validationPipe = new ValidationPipe({
      transform: true, // Transforms payload to match the DTO class
      whitelist: true, // Removes properties not defined in the DTO
    });

    return validationPipe.transform(data, {
      type: 'body', // Specifies the source of the payload (e.g., HTTP body)
      metatype, // The class/type to validate against
    });
  }
}
