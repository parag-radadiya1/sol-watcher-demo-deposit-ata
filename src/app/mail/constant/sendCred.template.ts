export const sendCredMailTemplate = (
  email: string,
  password: string,
  loginURL: string,
) => `
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 7px rgba(0, 0, 0, 0.15);">
        <div style="text-align: center;">
            <img src="https://images.squarespace-cdn.com/content/v1/5aad63094eddec9e7a16f63f/1521360284313-6MNOC2E97ZXCCTGGOG4Z/FYNE-logo-02.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
            <h1 style="color: #333;">Welcome to FYNE!</h1>
        </div>

        <div style="margin: 20px 0;">
            <p>Dear User,</p>

            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>

            <p>Please keep this information secure and do not share it with anyone. You can log in to your account using the button below:</p>

            <a href="${loginURL}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Log In to Your Account</a>

            <p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@codeedoc.com" style="color: #007bff; text-decoration: none;">support@codeedoc.com</a>.</p>

            <p>Welcome aboard!</p>
            <p>Best Regards,<br>The CODEEDOC Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>&copy; 2024 CODEEDOC. All rights reserved.</p>
        </div>
    </div>
</body>
`;
