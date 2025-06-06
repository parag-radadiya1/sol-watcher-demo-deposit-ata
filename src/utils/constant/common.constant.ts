export const commonResponse = {
  notFound: (val: string) => `${val}_not_found`,
  success: 'your_request_was_successfully_executed',
  badRequest: 'bad_request',
  internalServerError: 'internal_server_error',
  invalidToken: 'invalid_token',
  tokenNotFound: 'token_not_found',
  tokenExpired: 'your_token_is_expired',
  invalidObjectId: 'invalid_objectId',
  invalidRefreshToken: 'invalid_refresh_token',
  invalidStringParam: 'invalid_string _parameter',
  insufficientParameters: 'insufficient_parameters.',
  noContentFound: 'your_request_is_successfully_executed_but_content_not_found',
  unauthorizedRequest: 'you_are_not_authorized_to_access_the_request',
  forbiddenRequest: "you_don't_have_permission_to_access_this_request",
  refreshTokenSendSuccessfully: 'refresh_token_send_successfully',
  logoutSuccessfully: 'logout_successfully',
  invalidSharedSecret: 'invalid_shared_secret',
  invalidEmailAddress: 'invalid_email_address',
  forgotPasswordLinkSendSuccessfully: 'forgot_password_link_send_successfully',
  forgotPasswordSuccessfully: 'forgot_password_successfully',
  invalidPlanAction: 'invalid_plan_action',
  invalidPlanModelUploadAction: 'invalid_plan_model_upload_action',
  organizationIsInActiveContactWithYourOrganization:
    'your_organization_is_inactive_please_contact_with_your_organization',
  organizationIsBlockedContactWithSupport:
    'your_organization_is_blocked_please_contact_with_support',
};

export const commonSocketResponse = {
  encryptionKeyNotFound: 'encryption_key_not_established',
  fileTransferFailed: 'file_transfer_failed',
};

export const commonSocketEvent = {
  error: 'ERROR',
  auth: 'AUTH',
  joinRoom: 'JOIN_ROOM',
  serverHandshake: 'SERVER_HANDSHAKE',
  serverPublicKey: 'SERVER_PUBLIC_KEY',
  clientPublicKey: 'CLIENT_PUBLIC_KEY',
  getS3Data: 'DOWNLOAD_REQUEST',
  startOfFile: 'SOF',
  endOfFile: 'EOF',
  data: 'DATA',
};

export const historyConstant = {
  createdSuccessfully: (val: string) => `${val} created successfully`,
  updatedSuccessfully: (val: string) => `${val} updated successfully`,
  deletedSuccessfully: (val: string) => `${val} deleted successfully`,
  imageUploadedSuccessfully: (val: string) =>
    `Image uploaded successfully for ${val}`,
  videoUploadedSuccessfully: (val: string) =>
    `Video uploaded successfully for ${val}`,
  updatedConfigItemSuccessfully: (val: string) =>
    `${val} config items updated successfully`,
};
