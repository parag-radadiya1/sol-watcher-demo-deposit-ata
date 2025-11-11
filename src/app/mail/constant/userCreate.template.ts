export const userRegistrationEmailTemplate = (otp: string) => `
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 7px rgba(0, 0, 0, 0.15);">
        <div style="text-align: center;">
            <img src="https://images.squarespace-cdn.com/content/v1/5aad63094eddec9e7a16f63f/1521360284313-6MNOC2E97ZXCCTGGOG4Z/FYNE-logo-02.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
            <h1 style="color: #333;">Welcome to FYNE!</h1>
        </div>

        <div style="margin: 20px 0;">
            <p>Dear User,</p>

            <p>Thank you for registering with Fynetone! To complete your email verification, please use the OTP (One-Time Password) below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: #f8f9fa; border: 2px dashed #007bff; padding: 20px; border-radius: 10px;">
                    <h2 style="margin: 0; color: #007bff; font-size: 32px; letter-spacing: 8px; font-weight: bold;">${otp}</h2>
                </div>
            </div>

            <p style="text-align: center; color: #666; font-size: 14px;">This OTP is valid for 24 hours. Please do not share this code with anyone.</p>

            <p>Enter this OTP in the verification screen to activate your account and start using Fynetone services.</p>

            <p>If you didn't request this verification, please ignore this email or contact our support team immediately.</p>

            <p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@fynetone.com" style="color: #007bff; text-decoration: none;">support@fynetone.com</a>.</p>

            <p>Welcome aboard!</p>
            <p>Best Regards,<br>The Fynetone Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>&copy; 2025 Fynetone. All rights reserved.</p>
        </div>
    </div>
</body>
`;
