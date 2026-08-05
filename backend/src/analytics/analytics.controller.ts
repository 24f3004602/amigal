import { Controller, Post, Body, Logger } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  @Post('vitals')
  async reportVitals(@Body() vitals: any) {
    // Log for aggregation (send to Datadog/New Relic in production)
    this.logger.log({
      type: 'WEB_VITALS',
      ...vitals,
    });

    // Alert on poor performance
    if (vitals.cls > 0.1) {
      this.logger.warn({ type: 'POOR_CLS', value: vitals.cls }, 'High layout shift detected');
    }
    if (vitals.lcp > 2500) {
      this.logger.warn({ type: 'POOR_LCP', value: vitals.lcp }, 'Slow LCP detected');
    }
    if (vitals.fid > 100) {
      this.logger.warn({ type: 'POOR_FID', value: vitals.fid }, 'Slow FID detected');
    }

    return { received: true };
  }

  @Post('error')
  async reportError(@Body() error: any) {
    this.logger.error({
      type: 'FRONTEND_ERROR',
      ...error,
    });
    return { received: true };
  }
}
