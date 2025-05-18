import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Notification from './models/Notification.js';
import { Kafka } from 'kafkajs';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'notificationdb',
});
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB (API)');
});

const kafka = new Kafka({
  clientId: 'notification-api',
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

await producer.connect();
console.log('✅ Kafka Producer connected (API)');


// Middleware
app.use(express.json());

// Route: Get notifications for a user
app.get('/users/:id/notifications', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    console.error('❌ Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Root route (optional)
app.get('/', (req, res) => {
  res.send('🔔 Notification Service API is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.post('/notifications', async (req, res) => {
  const { userId, type, content } = req.body;

  if (!userId || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const message = {
    userId,
    type,
    content,
    status: 'pending',
    createdAt: new Date(),
  };

  try {
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(message), partition: 0 }],
    });

    res.status(200).json({ success: true, message: 'Notification queued' });
  } catch (err) {
    console.error('❌ Failed to send message to Kafka:', err.message);
    res.status(500).json({ error: 'Kafka error' });
  }
});
