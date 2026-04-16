export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  },
});
