import { Controller, Post, Get, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Req() req: any, @Body() body: { priceId: string }) {
    return this.subscriptionsService.createCheckoutSession(req.user.userId, body.priceId);
  }

  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Body() body: Buffer,
  ) {
    return this.subscriptionsService.handleWebhook(signature, body);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    return this.subscriptionsService.getStatus(req.user.userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req: any) {
    return this.subscriptionsService.cancelSubscription(req.user.userId);
  }
}
