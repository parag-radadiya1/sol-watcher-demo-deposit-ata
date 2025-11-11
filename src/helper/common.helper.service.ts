import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CommonService {
  /**
   * @description Compares a plain text password with a hashed password to check if they match.
   * @param {string} password - The plain text password to compare.
   * @param {string} hashedPassword - The hashed password to compare against.
   * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, otherwise false.
   */
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  /**
   * @description Hashes a plain text password using bcrypt with a salt rounds value of 10.
   * @param {string} password - The plain text password to hash.
   * @returns {Promise<string>} A promise that resolves to the hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch (error) {
      return '';
    }
  }

  /**
   * Generates a 6-digit One-Time Password (OTP) as a string.
   *
   * @returns {string} A 6-digit OTP, zero-padded if necessary (e.g., "004321").
   *
   * @example
   * const otp = this.generateOTP();
   * // otp => "123456"
   *
   * @description
   * This function is typically used for authentication flows such as
   * email or SMS verification, password resets, or any scenario where
   * a temporary numeric code is required for user validation.
   */
  generateOTP(): string {
    const OTP = Math.ceil(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    return OTP;
  }
}
