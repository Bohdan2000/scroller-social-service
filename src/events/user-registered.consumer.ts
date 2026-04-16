import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ProfilesService } from '../profiles/profiles.service';
import { SCROLLER_DLX, SCROLLER_EXCHANGE, Queues, RoutingKeys } from './events.constants';

interface UserRegisteredPayload {
  userId: string;
  email: string;
  createdAt: string;
  provider?: string;
}

@Injectable()
export class UserRegisteredConsumer {
  private readonly logger = new Logger(UserRegisteredConsumer.name);

  constructor(private readonly profilesService: ProfilesService) {}

  @RabbitSubscribe({
    exchange: SCROLLER_EXCHANGE,
    routingKey: RoutingKeys.USER_REGISTERED,
    queue: Queues.SOCIAL_USER_REGISTERED,
    queueOptions: {
      durable: true,
      deadLetterExchange: SCROLLER_DLX,
    },
  })
  async handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
    this.logger.log(`Received user.registered for userId=${payload.userId}`);

    try {
      await this.profilesService.createFromEvent(payload.userId, payload.email);
    } catch (err) {
      // Log and re-throw so @golevelup/nestjs-rabbitmq nacks the message to DLX
      this.logger.error(
        `Failed to create profile for userId=${payload.userId}: ${String(err)}`,
      );
      throw err;
    }
  }
}
