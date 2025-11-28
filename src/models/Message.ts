import mongoose, { Schema, Document, Types } from 'mongoose';

export type Sender = 'user' | 'bot';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Sender;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);


