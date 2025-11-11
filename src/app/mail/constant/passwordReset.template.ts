export const passwordResetEmailTemplate = (otp: string) => `
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 7px rgba(0, 0, 0, 0.15);">
        <div style="text-align: center;">
            <img src="https://images.squarespace-cdn.com/content/v1/5aad63094eddec9e7a16f63f/1521360284313-6MNOC2E97ZXCCTGGOG4Z/FYNE-logo-02.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
            <h1 style="color: #333;">Password Reset Request</h1>
        </div>

        <div style="margin: 20px 0;">
            <p>Dear User,</p>

            <p>We received a request to reset your password for your Fynetone account. Please use the OTP below to reset your password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 20px 30px; background: #fff3cd; border: 2px dashed #dc3545; border-radius: 10px; font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px;">
                    ${otp}
                </div>
            </div>

            <p style="text-align: center; color: #666; font-size: 14px;">This OTP will expire in 10 minutes for your security.</p>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Security Note:</strong> If you did not request this password reset, please ignore this email and contact our support team immediately.
            </div>

            <p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@fynetone.com" style="color: #007bff; text-decoration: none;">support@fynetone.com</a>.</p>

            <p>Best Regards,<br>The Fynetone Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>&copy; 2025 Fynetone. All rights reserved.</p>
        </div>
    </div>
</body>
`;
