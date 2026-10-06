import prisma from '../repositories/prisma';
import { CheckoutService } from '../services/checkout.service';
import { EmailService } from '../integrations/email';

let running = false;
export async function runJobs() {
  if (running) return;
  running = true;
  try {
    await CheckoutService.releaseExpired();
    await prisma.cart.deleteMany({ where: { customerId: null, updatedAt: { lt: new Date(Date.now() - 30 * 86400_000) } } });
    const jobs = await prisma.emailJob.findMany({ where: { sentAt: null,
      nextAttemptAt: { lte: new Date() }, attempts: { lt: 10 } }, take: 20 });
    for (const job of jobs) {
      // Claim with a lease; only one replica can send this attempt.
      const claim = await prisma.emailJob.updateMany({ where: { id: job.id, sentAt: null,
        nextAttemptAt: { lte: new Date() } }, data: { attempts: { increment: 1 },
        nextAttemptAt: new Date(Date.now() + 5 * 60_000) } });
      if (!claim.count) continue;
      try {
        await EmailService.sendEmail(job.recipient, job.subject, job.html);
        await prisma.emailJob.update({ where: { id: job.id }, data: { sentAt: new Date() } });
      } catch {
        console.error(JSON.stringify({ event: 'email_delivery_failed', jobId: job.id }));
      }
    }
  } finally { running = false; }
}
