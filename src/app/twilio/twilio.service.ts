import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

const configService = new ConfigService();
const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');

const client = require('twilio')(accountSid, authToken);

const twilioContactSid = configService.get<string>('TWILIO_CONTACT_SID');
const twilioWhatsappNumber = configService.get<string>(
  'TWILIO_WHATSAPP_NUMBER',
);
const env = configService.get<string>('ENV');

@Injectable()
export class TwilioService {
  sendOtpToWhatsapp(toNumber: string, otp: string): void {
    if (env != 'DEV') {
      client.messages
        .create({
          from: twilioWhatsappNumber,
          contentSid: twilioContactSid,
          contentVariables: JSON.stringify({
            '1': `${otp}`, // This is the OTP
          }),
          to: `whatsapp:+${toNumber}`,
        })
        .then(() => {
          return true;
        })
        .catch((error: Error) => {
          console.error(`Failed to send message: ${error.message}`);
          return false;
        });
    }
  }
}
