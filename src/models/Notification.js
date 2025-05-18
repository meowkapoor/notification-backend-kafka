import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: Number,
  type: {
    type: String,
    enum: ['email', 'sms', 'in-app'],
    required: true,
  },
  content: String,
  status: {
    type: String,
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
