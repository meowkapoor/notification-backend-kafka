import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'notification-producer',
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();
  console.log('🚀 Kafka producer connected');

  const message = {
    userId: 1,
    type: 'email', // or 'sms', 'in-app'
    content: 'Hello from Kafka!',
    status: 'pending',
    createdAt: new Date(),
  };

  await producer.send({
  topic: 'notifications',
  messages: [
    {
      value: JSON.stringify(message),
      partition: 0 // 🔐 force delivery
    }
  ]
});

  console.log('📤 Notification message sent to Kafka');

  await producer.disconnect();
};

run().catch(console.error);
