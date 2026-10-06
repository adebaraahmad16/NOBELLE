import prisma from '../repositories/prisma';
import { serializable } from '../database/transaction';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';

export class SessionService {
  static async rotate(rawToken: string, admin: boolean) {
    return serializable(async tx => {
      const stored = await tx.refreshToken.findUnique({ where: { tokenHash: TokenUtil.hashToken(rawToken) }, include: { admin: true, customer: true } });
      const account = admin ? stored?.admin : stored?.customer;
      if (!stored || stored.revoked || stored.expiresAt <= new Date() || !account?.isActive || (admin?stored.admin?.deletedAt:stored.customer?.deletedAt)) throw ApiError.unauthorized('Session expired');
      await tx.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      const next = TokenUtil.generateRefreshToken();
      const session = await tx.refreshToken.create({ data: { tokenHash: next.hash, userId: account.id,
        userType: admin ? 'ADMIN' : 'CUSTOMER', adminId: admin ? account.id : null,
        customerId: admin ? null : account.id, expiresAt: next.expiresAt, remember: stored.remember, userAgent:stored.userAgent,loginAt:stored.loginAt || stored.createdAt,lastActiveAt:new Date() } });
      const accessToken = TokenUtil.generateAccessToken({ id: account.id, email: account.email,
        role: admin ? 'ADMIN' : 'CUSTOMER', ...(admin ? { adminRole: stored.admin!.role, sid: session.id } : {}) });
      return { accessToken, refreshToken: next.token, remember: stored.remember };
    });
  }
}
