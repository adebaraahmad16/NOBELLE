import { clientDevice, safeAdminSelect, SettingsService } from './settings.service';
import { serializable } from '../database/transaction';
import crypto from 'crypto';
import prisma from '../repositories/prisma';
import { PasswordUtil } from '../utils/password';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';
import { EmailService } from '../integrations/email';
import { ENV } from '../config/env';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class AdminAuthService {
  static async login(email: string, password: string, remember = false, userAgent?: string) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.isActive || admin.deletedAt) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await PasswordUtil.compare(password, admin.passwordHash);
    if (!isMatch) {
      await prisma.activityLog.create({data:{adminId:admin.id,action:'LOGIN_FAILURE',entity:'Admin',entityId:admin.id,metadata:clientDevice(userAgent)}});
      throw ApiError.unauthorized('Invalid email or password');
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const { token: rawRefreshToken, hash: tokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    const session=await prisma.refreshToken.create({data:{tokenHash,userId:admin.id,userType:'ADMIN',adminId:admin.id,expiresAt,remember,userAgent:userAgent?.slice(0,512),loginAt:new Date(),lastActiveAt:new Date()}});
    const accessToken=TokenUtil.generateAccessToken({id:admin.id,email:admin.email,role:'ADMIN',adminRole:admin.role,sid:session.id});
    await prisma.activityLog.create({data:{adminId:admin.id,action:'LOGIN_SUCCESS',entity:'Admin',entityId:admin.id,metadata:clientDevice(userAgent)}});

    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions:await SettingsService.permissions(admin.role),
      phone: admin.phone, avatarUrl: admin.avatarUrl,
    };

    return { admin: adminData, accessToken, refreshToken: rawRefreshToken, remember };
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
    if (!admin || !admin.isActive || admin.deletedAt) {
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

    await prisma.emailJob.create({ data: { key: `admin-reset:${tokenHash}`, recipient: admin.email,
      subject: 'NOBELLE admin password reset', html: `<p><a href="${resetUrl}">Reset password</a>. This link expires in 30 minutes.</p>` } });

    return { sent: true };
  }

  static async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = TokenUtil.hashToken(rawToken);
    const passwordHash = await PasswordUtil.hash(newPassword);
    return serializable(async tx => {
      const record = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { admin: true } });
      if (!record?.adminId || record.usedAt || record.revoked || record.expiresAt <= new Date() || record.userType !== 'ADMIN' || !record.admin?.isActive) throw ApiError.badRequest('Invalid or expired reset link');
      await tx.admin.update({ where: { id: record.adminId }, data: { passwordHash } });
      await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await tx.refreshToken.updateMany({ where: { adminId: record.adminId }, data: { revoked: true } });
      return { reset: true };
    });
  }

  static async getMe(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: safeAdminSelect,
    });
    if (!admin) throw ApiError.notFound('Admin not found');
    return {...admin,permissions:await SettingsService.permissions(admin.role)};
  }
}
