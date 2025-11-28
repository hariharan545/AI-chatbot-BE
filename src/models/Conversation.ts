import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  userId: Types.ObjectId;
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);


