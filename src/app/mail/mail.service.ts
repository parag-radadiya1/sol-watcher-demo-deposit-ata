import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailClient } from 'zeptomail';
import { IToDetailInfo } from './dto';
const configService = new ConfigService();
const token = configService.get<string>('ZEPTO_TOKEN');
const url = configService.get<string>('ZEPTO_URL');
let client = new SendMailClient({ url, token });
const address = configService.get<string>('APP_EMAIL');
const name = configService.get<string>('APP_EMAIL_NAME');
const env = configService.get<string>('ENV');

@Injectable()
export class MailService {
  /**
   * @description Sends an email using an external mail client. The email is only sent if the environment is not 'DEV'.
   * @param {IToDetailInfo} toDetails - The recipient's email details, including the email address.
   * @param {string} subject - The subject line of the email.
   * @param {string} htmlTemplate - The HTML body content of the email.
   * @returns {void} - This function does not return a value.
   * @throws {Error} - If there is an error in sending the email, it returns `false` but does not throw an error.
   *
   * @example
   * sendMail({ email_address: 'example@example.com' }, 'Subject', '<h1>Email Body</h1>');
   */
  sendMail(
    toDetails: IToDetailInfo,
    subject: string,
    htmlTemplate: string,
  ): void {
    // if (env != 'DEV') {
    client
      .sendMail({
        from: {
          address,
          name,
        },
        to: [
          {
            email_address: toDetails,
          },
        ],
        subject,
        htmlbody: htmlTemplate,
      })
      .then(() => {
        return true;
      })
      .catch((error: Error) => false);
    // }
  }
}
