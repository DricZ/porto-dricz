require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASS || undefined,
  maxRetriesPerRequest: null
});
const emailQueue = new Queue('emailQueue', { connection });

async function check() {
  const failed = await emailQueue.getFailed();
  console.log('Failed jobs:', failed.map(j => ({ id: j.id, failedReason: j.failedReason })));
  
  const active = await emailQueue.getActive();
  console.log('Active jobs:', active.map(j => j.id));

  const completed = await emailQueue.getCompleted();
  console.log('Completed jobs:', completed.map(j => j.id));
  
  process.exit(0);
}
check();
