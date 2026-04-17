export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  },
  s3: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    // Optional: set to a CloudFront domain to serve files from CDN
    cdnUrl: process.env.AWS_CDN_URL ?? '',
  },
});
