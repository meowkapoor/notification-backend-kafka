import { Kafka } from 'kafkajs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification.js';

dotenv.config();

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const start = async () => {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'notificationdb',
  });
  console.log('✅ Connected to MongoDB');

  // Connect to Kafka
  await consumer.connect();
  await consumer.subscribe({ topic: 'notifications', fromBeginning: true });
  console.log('📥 Subscribed to Kafka topic: notifications');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log('📨 Received:', data);

      try {
        await Notification.create(data);
        console.log('✅ Notification saved to MongoDB');
      } catch (err) {
        console.error('❌ Failed to save notification:', err.message);
      }
    },
  });
};

start().catch(console.error);
