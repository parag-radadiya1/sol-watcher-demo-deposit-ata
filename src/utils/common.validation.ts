import { commonResponse } from '@utils/constant';
import { supportedCountries } from '@utils/constants';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';


/**
 * Custom decorator to validate mobile numbers based on the provided country code.
 *
 * This decorator checks if the mobile number matches the format for the specified country code.
 * It uses the supportedCountries object to determine the regex for validation.
 *
 * @param {ValidationOptions} [validationOptions] - Optional validation options for class-validator.
 * @returns {PropertyDecorator} - A property decorator function for use with class-validator.
 *
 * @example
 * class UserDto {
 *   @IsValidMobileNumber({ message: 'Invalid mobile number' })
 *   mobileNumber: string;
 *
 *   countryCode: string;
 * }
 */
export function IsValidMobileNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(mobileNumber: any, args: ValidationArguments) {
          const object: any = args.object;
          const countryCode = object?.countryCode;

          if (!countryCode || !supportedCountries[countryCode]) {
            return false;
          }

          const cleanedNumber = String(mobileNumber).replace(/[\s\-()]/g, '');
          return supportedCountries[countryCode].test(cleanedNumber);
        },
        defaultMessage() {
          return commonResponse.invalidMobileNumber;
        },
      },
    });
  };
}

/**
 * Custom decorator to validate if a given country code is supported.
 *
 * This decorator checks if the provided country code exists in the supportedCountries object.
 * It is useful for validating country code fields in DTOs.
 *
 * @param {ValidationOptions} [validationOptions] - Optional validation options for class-validator.
 * @returns {PropertyDecorator} - A property decorator function for use with class-validator.
 *
 * @example
 * class UserDto {
 *   @IsValidCountryCode({ message: 'Invalid country code' })
 *   countryCode: string;
 * }
 */
export function IsValidCountryCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(countryCode: any) {
          if (countryCode && supportedCountries[countryCode]) {
            return true;
          }
          return false;
        },
        defaultMessage() {
          return commonResponse.invalidCountryCode;
        },
      },
    });
  };
}
