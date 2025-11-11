export const changeEmailTemplate = (
  verificationUrl: string,
  newEmail: string,
) => `
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 7px rgba(0, 0, 0, 0.15);">
        <div style="text-align: center;">
            <img src="https://images.squarespace-cdn.com/content/v1/5aad63094eddec9e7a16f63f/1521360284313-6MNOC2E97ZXCCTGGOG4Z/FYNE-logo-02.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
            <h1 style="color: #333;">Email Change Request</h1>
        </div>

        <div style="margin: 20px 0;">
            <p>Dear User,</p>

            <p>We received a request to change your email address to: <strong>${newEmail}</strong></p>
            
            <p>To confirm this change, please click the button below or copy the link and paste it in your browser:</p>
            <p>${verificationUrl}</p>

            <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">Confirm Email Change</a>
            </div>

            <p>If you did not request this change, please ignore this email or contact our support team immediately.</p>
            
            <p>This link will expire in 10 mins for security reasons.</p>

            <p>Best Regards,<br>The Fynetone Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>&copy; 2025 Fynetone. All rights reserved.</p>
        </div>
    </div>
</body>
`;
