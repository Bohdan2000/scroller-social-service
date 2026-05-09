import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const topics = [
  { slug: 'typescript',       title: 'TypeScript' },
  { slug: 'javascript',       title: 'JavaScript' },
  { slug: 'python',           title: 'Python' },
  { slug: 'rust',             title: 'Rust' },
  { slug: 'golang',           title: 'Go' },
  { slug: 'nestjs',           title: 'NestJS' },
  { slug: 'react',            title: 'React' },
  { slug: 'react-native',     title: 'React Native' },
  { slug: 'nodejs',           title: 'Node.js' },
  { slug: 'docker',           title: 'Docker' },
  { slug: 'kubernetes',       title: 'Kubernetes' },
  { slug: 'aws',              title: 'AWS' },
  { slug: 'system-design',    title: 'System Design' },
  { slug: 'postgresql',       title: 'PostgreSQL' },
  { slug: 'mongodb',          title: 'MongoDB' },
  { slug: 'redis',            title: 'Redis' },
  { slug: 'graphql',          title: 'GraphQL' },
  { slug: 'rest-api',         title: 'REST API' },
  { slug: 'devops',           title: 'DevOps' },
  { slug: 'ci-cd',            title: 'CI/CD' },
  { slug: 'security',         title: 'Security' },
  { slug: 'machine-learning', title: 'Machine Learning' },
  { slug: 'data-science',     title: 'Data Science' },
  { slug: 'git',              title: 'Git' },
  { slug: 'linux',            title: 'Linux' },
  { slug: 'microservices',    title: 'Microservices' },
  { slug: 'web-development',  title: 'Web Development' },
  { slug: 'mobile',           title: 'Mobile Development' },
  { slug: 'algorithms',       title: 'Algorithms' },
  { slug: 'clean-code',       title: 'Clean Code' },
];

async function main() {
  console.log('Seeding topics...');

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: { title: topic.title },
      create: topic,
    });
  }

  console.log(`Seeded ${topics.length} topics.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
