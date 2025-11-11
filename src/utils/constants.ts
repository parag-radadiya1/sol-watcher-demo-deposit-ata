export const REGEX = {
  companyName: /^[a-zA-Z0-9 ]*$/,
  userName: /[a-zA-Z]/,
  partyName: /^[a-zA-Z0-9]+$/,
  objectId: /^[0-9a-fA-F]{24}$/,
  file: /[/\s]+/g,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
  specialCharacters: /^[a-zA-Z0-9\s-]*[a-zA-Z0-9][a-zA-Z0-9\s-]*$/,

};

export const PAGINATION_CONFIG = {
  page: 1,
  limit: 0,
};

export const supportedCountries: { [code: string]: RegExp } = {
  '+1': /^[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US/Canada
  '+91': /^[6-9]\d{9}$/, // India
  '+92': /^[3]\d{9}$/, // Pakistan
  '+880': /^1[3-9]\d{8}$/, // Bangladesh
  '+94': /^7\d{8}$/, // Sri Lanka
  '+81': /^([7-9]0)\d{8}$/, // Japan
  '+82': /^1[0-9]{9}$/, // South Korea
  '+44': /^7\d{9}$/, // UK
  '+49': /^1[5-7]\d{8}$/, // Germany
  '+33': /^6\d{8}$/, // France
  '+39': /^3\d{9}$/, // Italy
  '+34': /^6\d{8}|7\d{8}$/, // Spain
  '+971': /^5[0-9]{8}$/, // UAE
  '+966': /^5\d{8}$/, // Saudi Arabia
  '+27': /^6\d{8}|7\d{8}$/, // South Africa
  '+234': /^7\d{9}|8\d{9}|9\d{9}$/, // Nigeria
  '+61': /^4\d{8}$/, // Australia
  '+64': /^2\d{7,9}$/, // New Zealand
  '+55': /^9\d{8}$/, // Brazil
  '+52': /^1\d{10}$/, // Mexico
  '+63': /^9\d{9}$/, // Philippines
  '+65': /^[89]\d{7}$/, // Singapore
  '+60': /^1[0-9]{8,9}$/, // Malaysia
  '+66': /^8\d{8}|9\d{8}$/, // Thailand
};

export const TIME_EXPIRY = {
  oneDay: 86400, // 1 day
  oneHour: 3600, // 1 hour
  tenMin: 600, // 10 mins
};

export const EMAIL_SUBJECT = {
  welcome: 'Welcome to fyne',
  forgot: 'Password forgot request',
  verify: 'Verify your account',
  verifyEmail: 'Verify your email',
  changeEmail: 'Email change request',
  userInvited: 'You have been invited !!!',
  forgotPassword: 'Password Reset Request',
};

export const APP_URL = {
  orgLogin: '/organization',
  userLogin: '/',
  orgVerify: '/organization/verify',
  userResetPassword: '/reset-password',
  orgResetPassword: '/organization/reset-password',
  userInvitationPage: '/invitation',
  userVerifyEmail: '/verify-email',
  userChangeEmail: '/verify-email',
};

export const OTP_EXPIRY_TIME = 600 * 1000; //10 mins in milli
