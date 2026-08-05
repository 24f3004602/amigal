import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

const PLANS = {
  basic: {
    name: 'Basic',
    videoLimit: 50,
    priceLookupKey: 'basic_monthly',
  },
  premium: {
    name: 'Premium',
    videoLimit: 999999,
    priceLookupKey: 'premium_monthly',
  },
};

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!);
  }

  async createCheckoutSession(userId: string, priceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      // As of API version 2025-xx (stripe-node v18+), billing period boundaries
      // live on the subscription's items rather than on the subscription itself.
      const firstItem = subscription.items.data[0];
      const priceId = firstItem.price.id;
      const prices = await this.stripe.prices.list({
        lookup_keys: Object.values(PLANS).map((p) => p.priceLookupKey),
      });
      const price = prices.data.find((p) => p.id === priceId);

      const tier =
        Object.entries(PLANS).find(([, v]) => v.priceLookupKey === price?.lookup_key)?.[0] ||
        'basic';
      const limit = PLANS[tier as keyof typeof PLANS]?.videoLimit || 50;

      await this.prisma.user.updateMany({
        where: { stripeCustomerId: session.customer as string },
        data: {
          subscriptionStatus: 'active',
          subscriptionTier: tier,
          stripeSubscriptionId: subscription.id,
          subscriptionEndsAt: new Date(firstItem.current_period_end * 1000),
          videoChatsLimit: limit,
        },
      });
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      await this.prisma.user.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { subscriptionStatus: 'past_due' },
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await this.prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscriptionStatus: 'cancelled',
          subscriptionTier: 'free',
          videoChatsLimit: 5,
        },
      });
    }

    return { received: true };
  }


  async getPlans() {
    return Object.entries(PLANS).map(([key, plan]) => ({
      tier: key,
      name: plan.name,
      videoLimit: plan.videoLimit,
    }));
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionEndsAt: true,
        videoChatsUsed: true,
        videoChatsLimit: true,
        stripeSubscriptionId: true,
      },
    });
    return user;
  }

  async cancelSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (user?.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
    }

    return { success: true };
  }
}
