import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TurnCredentials {
  username: string;
  credential: string;
  urls: string[];
  ttl: number;
}

@Injectable()
export class TurnService {
  private readonly logger = new Logger(TurnService.name);
  private readonly METERED_API_KEY = process.env.METERED_API_KEY!;
  private readonly METERED_APP_ID = process.env.METERED_APP_ID!;

  constructor(private readonly http: HttpService) {}

  async getTurnCredentials(): Promise<TurnCredentials> {
    try {
      // Generate temporary credentials (valid for 24 hours)
      const response = await firstValueFrom(
        this.http.get(
          `https://amigal.metered.live/api/v1/turn/credentials?apiKey=${this.METERED_API_KEY}`,
          { timeout: 5000 }
        )
      );

      return {
        username: response.data.username,
        credential: response.data.credential,
        urls: [
          'turn:a.relay.metered.ca:80',
          'turn:a.relay.metered.ca:80?transport=tcp',
          'turn:a.relay.metered.ca:443',
          'turn:a.relay.metered.ca:443?transport=tcp',
          'turn:a.relay.metered.ca:3478',
          'turn:a.relay.metered.ca:3478?transport=tcp',
        ],
        ttl: 86400,
      };
    } catch (err) {
      this.logger.error('Failed to fetch TURN credentials', err);
      throw new Error('TURN service unavailable');
    }
  }

  // Alternative: Use Metered's REST API directly
  async getIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `https://amigal.metered.live/api/v1/turn/credentials?apiKey=${this.METERED_API_KEY}`,
          { timeout: 5000 }
        )
      );

      return [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: response.data.urls || [
            'turn:a.relay.metered.ca:80',
            'turn:a.relay.metered.ca:443',
          ],
          username: response.data.username,
          credential: response.data.credential,
        },
      ];
    } catch (err) {
      this.logger.error('Metered API error, falling back to STUN only', err);
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }
}
