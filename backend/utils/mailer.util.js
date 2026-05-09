import nodemailer from 'nodemailer';
import { isDev, projectName, smtpConfig } from '../configs/env.config.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: smtpConfig
});

const root = isDev ? "http://localhost:5173" : `https://${projectName}.arkanafaisal.my.id`;

// Helper function agar desain UI email seragam dan tidak perlu ditulis ulang
const generateEmailTemplate = (title, message, buttonText, link) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #18181b; background-color: #ffffff;">
      
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 24px; color: #18181b; letter-spacing: -0.5px;">
        ${projectName}
      </h1>
      
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #18181b;">
        ${title}
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px; color: #52525b;">
        ${message}
      </p>
      
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
        <tr>
          <td align="center" bgcolor="#18181b" style="border-radius: 8px;">
            <a href="${link}" target="_blank" style="font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 28px; border: 1px solid #18181b; display: inline-block; border-radius: 8px;">
              ${buttonText}
            </a>
          </td>
        </tr>
      </table>
      
      <p style="font-size: 14px; line-height: 1.5; color: #52525b; margin-bottom: 8px;">
        If the button above doesn't work, copy and paste this URL into your web browser:
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #2563eb; word-break: break-all; margin-bottom: 32px;">
        <a href="${link}" style="color: #2563eb;">${link}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin-bottom: 24px;" />
      
      <p style="font-size: 12px; line-height: 1.5; color: #a1a1aa;">
        This is an automated message from ${projectName}. Please do not reply to this email. 
        If you did not request this action, you can safely ignore this email.
      </p>
    </div>
  `;
};

export const sendMail = {
  verifyEmail: async ({ email, token }) => {
    const link = `${root}/auth/verify-email/${token}`;
    
    await transporter.sendMail({
      from: `"${projectName}" <no-reply@arkanafaisal.my.id>`,
      to: email,
      subject: `Verify your email for ${projectName}`,
      // Text murni untuk fallback klien email jadul / notifikasi HP
      text: `Welcome to ${projectName}!\n\nPlease verify your email address by clicking the link below:\n${link}\n\nIf you did not request this, please ignore this email.`,
      html: generateEmailTemplate(
        'Verify your email address',
        'Thank you for signing up! To complete your registration and secure your account, please verify your email address by clicking the button below.',
        'Verify Email',
        link
      )
    });
  },
  
  resetPassword: async ({ email, token }) => {
    const link = `${root}/auth/reset-password/${token}`; // Disesuaikan dengan routing App.jsx Anda
    
    await transporter.sendMail({
      from: `"${projectName}" <no-reply@arkanafaisal.my.id>`,
      to: email,
      subject: `Reset your ${projectName} password`,
      text: `We received a request to reset your password.\n\nYou can reset it by clicking the link below:\n${link}\n\nIf you did not request a password reset, please ignore this email.`,
      html: generateEmailTemplate(
        'Password Reset Request',
        'We received a request to reset the password for your account. If you made this request, click the button below to choose a new password.',
        'Reset Password',
        link
      )
    });
  }
};