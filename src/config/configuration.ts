export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
  },
});
