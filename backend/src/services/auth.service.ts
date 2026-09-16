import prisma from '../repositories/prisma';
import { PasswordUtil } from '../utils/password';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';

export class AuthService {
  static async register(data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    const existing = await prisma.customer.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await PasswordUtil.hash(data.password);
    const customer = await prisma.customer.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    const accessToken = TokenUtil.generateAccessToken({
      id: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
    });

    const { token: rawRefreshToken, hash: tokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: customer.id,
        userType: 'CUSTOMER',
        customerId: customer.id,
        expiresAt,
      },
    });

    return { customer, accessToken, refreshToken: rawRefreshToken };
  }

  static async login(email: string, password: string) {
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer || customer.deletedAt || !customer.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await PasswordUtil.compare(password, customer.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = TokenUtil.generateAccessToken({
      id: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
    });

    const { token: rawRefreshToken, hash: tokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: customer.id,
        userType: 'CUSTOMER',
        customerId: customer.id,
        expiresAt,
      },
    });

    const customerData = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      avatarUrl: customer.avatarUrl,
    };

    return { customer: customerData, accessToken, refreshToken: rawRefreshToken };
  }

  static async refreshToken(rawToken: string) {
    const tokenHash = TokenUtil.hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.customer) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    // Generate new pair
    const accessToken = TokenUtil.generateAccessToken({
      id: stored.customer.id,
      email: stored.customer.email,
      role: 'CUSTOMER',
    });

    const { token: newRawRefreshToken, hash: newTokenHash, expiresAt } = TokenUtil.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: stored.customer.id,
        userType: 'CUSTOMER',
        customerId: stored.customer.id,
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

  static async getProfile(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        addresses: true,
      },
    });
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }
}
