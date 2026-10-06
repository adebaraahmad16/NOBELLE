import { Prisma } from '@prisma/client';
import prisma from '../repositories/prisma';

export async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable', timeout: 15000 });
    } catch (error: any) {
      if (error.code !== 'P2034' || attempt >= 4) throw error;
    }
  }
}
