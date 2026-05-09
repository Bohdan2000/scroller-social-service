export const SCROLLER_EXCHANGE = 'scroller.topic';
export const SCROLLER_DLX = 'scroller.dlx';

export const Queues = {
  SOCIAL_USER_REGISTERED: 'social.user.registered',
} as const;

export const RoutingKeys = {
  USER_REGISTERED:    'user.registered',
  USER_TOPICS_UPDATED: 'user.topics.updated',
  FRIENDSHIP_CREATED: 'friendship.created',
} as const;
