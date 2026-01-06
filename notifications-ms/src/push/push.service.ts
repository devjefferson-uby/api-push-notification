
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { messaging } from 'firebase-admin';

export interface PushPayload {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private firebaseService: FirebaseService) {}

  async sendPushNotification(payload: PushPayload): Promise<void> {
    const { deviceToken, title, body, data } = payload;

    const message: messaging.Message = {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await this.firebaseService.getMessaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      // Here you might want to handle the error, e.g., by removing an invalid token from the database
    }
  }
}
