import prisma from '../repositories/prisma';
import { PasswordUtil } from '../utils/password';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';

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
