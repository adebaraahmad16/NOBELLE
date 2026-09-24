import crypto from 'crypto';
import prisma from '../repositories/prisma';
import { PasswordUtil } from '../utils/password';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';
import { EmailService } from '../integrations/email';
import { ENV } from '../config/env';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class AdminAuthService {
  static async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await PasswordUtil.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = TokenUtil.generateAccessToken({
      id: admin.id,
      email: admin.email,
      role: 'ADMIN',
      adminRole: admin.role,
    });

    const { token: rawRefreshToken, hash: tokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: admin.id,
        userType: 'ADMIN',
        adminId: admin.id,
        expiresAt,
      },
    });

    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return { admin: adminData, accessToken, refreshToken: rawRefreshToken };
  }

  static async refreshToken(rawToken: string) {
    const tokenHash = TokenUtil.hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.admin) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const accessToken = TokenUtil.generateAccessToken({
      id: stored.admin.id,
      email: stored.admin.email,
      role: 'ADMIN',
      adminRole: stored.admin.role,
    });

    const { token: newRawRefreshToken, hash: newTokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: stored.admin.id,
        userType: 'ADMIN',
        adminId: stored.admin.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: newRawRefreshToken };
  }

  static async logout(rawToken?: string) {
    if (rawToken) {
      const tokenHash = TokenUtil.hashToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
  }

  static async forgotPassword(email: string) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success — never reveal whether the account exists.
    if (!admin || !admin.isActive) {
      return { sent: true };
    }

    // Invalidate any previous unused tokens for this admin
    await prisma.passwordResetToken.updateMany({
      where: { adminId: admin.id, userType: 'ADMIN', usedAt: null, revoked: false },
      data: { revoked: true },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = TokenUtil.hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userType: 'ADMIN',
        adminId: admin.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${ENV.ADMIN_URL}/admin/reset-password?token=${rawToken}`;

    await EmailService.sendEmail(
      admin.email,
      'NOBELLE Admin — Password Reset',
      `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #641F2D;">NOBELLE Admin</h2>
          <p style="color: #242124;">Hello ${admin.name},</p>
          <p style="color: #242124;">We received a request to reset your NOBELLE admin password. This link expires in 30 minutes.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #641F2D; color: #FCFAF7; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </p>
          <p style="color: #777277; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    );

    return { sent: true };
  }

  static async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = TokenUtil.hashToken(rawToken);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });

    if (!record || record.usedAt || record.revoked || record.expiresAt < new Date() || record.userType !== 'ADMIN' || !record.admin) {
      throw ApiError.badRequest('Invalid or expired reset link. Please request a new one.');
    }

    const passwordHash = await PasswordUtil.hash(newPassword);

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: record.adminId! },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing sessions for this admin
      prisma.refreshToken.updateMany({
        where: { adminId: record.adminId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return { reset: true };
  }

  static async getMe(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!admin) throw ApiError.notFound('Admin not found');
    return admin;
  }
}
