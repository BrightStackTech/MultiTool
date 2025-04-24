const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
  },
});

// Send welcome email to new users
// const sendWelcomeEmail = async (email, username) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_FROM,
//       to: email,
//       subject: 'Welcome to MultiTool!',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Welcome to MultiTool!</h2>
//           <p>Hello ${username},</p>
//           <p>Thank you for registering with our service. We're excited to have you on board!</p>
//           <p>With MultiTool, you can access various tools like:</p>
//           <ul>
//             <li>URL Shortener</li>
//             <li>PDF Converter</li>
//             <li>PDF Merger</li>
//             <li>Image to PDF</li>
//             <li>Image Compressor</li>
//             <li>Circle Crop Image</li>
//           </ul>
//           <p>Feel free to explore all our features!</p>
//           <p>Best regards,<br>The MultiTool Team</p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log('Welcome email sent successfully');
//   } catch (error) {
//     console.error('Error sending welcome email:', error);
//   }
// };

const sendVerificationEmail = async (email, username, verificationUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <div>
          <h2>Verify Your Email</h2>
          <p>Hello ${username},</p>
          <p style="margin-bottom:5px">Thank you for registering. Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
          <p style="margin-top:5px">If you did not register, please ignore this email.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};


// Send password reset email
const sendPasswordResetEmail = async (email, username, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>You requested a password reset for your MultiTool account.</p>
          <p style="margin-bottom:5px">Please click the link below to reset your password:</p>
          <p>
            <a 
              href="${resetUrl}" 
              style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
            >
              Reset Password
            </a>
          </p>
          <p style="margin-top:5px">This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br>The MultiTool Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
}; 