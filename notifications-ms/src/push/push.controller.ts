
import { Controller, Post, Body } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

class PushTestDto {
  token: string;
  message: string;
  title: string;
  data?: Record<string, any>;
}

@Controller('push')
export class PushController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Post('test')
  async testPush(@Body() body: PushTestDto) {
    this.eventEmitter.emit('notification.send', {
      deviceToken: body.token,
      title: body.title,
      body: body.message,
      data: body.data,
    });
    return { status: 'Event emitted for push notification.' };
  }
}
