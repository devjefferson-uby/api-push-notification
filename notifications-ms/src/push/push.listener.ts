
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PushService, PushPayload } from './push.service';

@Injectable()
export class PushListener {
  private readonly logger = new Logger(PushListener.name);

  constructor(private pushService: PushService) {}

  @OnEvent('notification.send')
  handleNotificationSendEvent(payload: PushPayload) {
    this.logger.log(`Received notification.send event for token: ${payload.deviceToken}`);
    this.pushService.sendPushNotification(payload);
  }
}
