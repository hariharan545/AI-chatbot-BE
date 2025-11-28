import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import cookie from 'cookie';
import { verifyJwt } from '../utils/jwt';
import { logger } from '../utils/logger';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { AiWsClient } from './aiClient';

interface AuthedWs extends WebSocket {
  userId?: string;
}

const AI_WS_URL = process.env.AI_WS_URL || 'ws://localhost:8000/ws/generate';

export function createWsServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });
  const aiClient = new AiWsClient(AI_WS_URL);

  wss.on('connection', async (ws: AuthedWs, req) => {
    try {
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = cookies['jwt'];
      if (!token) {
        ws.close();
        return;
      }
      const payload = verifyJwt(token);
      ws.userId = payload.userId;
    } catch {
      ws.close();
      return;
    }

    ws.on('message', async (raw) => {
      try {
        const { type, payload } = JSON.parse(raw.toString());
        if (type === 'user_message') {
          const text: string = (payload.text || '').trim();
          if (!text) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  payload: { message: 'Message text is required.' }
                })
              );
            }
            return;
          }
          const conversation = await Conversation.create({ userId: ws.userId });
          await Message.create({
            conversationId: conversation.id,
            sender: 'user',
            text,
            timestamp: new Date()
          });

          const botMessageId = conversation.id.toString();
          let fullText = '';
          let emittedToken = false;

          await aiClient.streamCompletion(text, async (token) => {
            emittedToken = true;
            fullText += token;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'bot_token',
                  payload: { id: botMessageId, token }
                })
              );
            }
          });

          if (!emittedToken) {
            const fallback = 'Sorry, I could not generate a response. Please try again.';
            fullText = fallback;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'bot_token',
                  payload: { id: botMessageId, token: fallback }
                })
              );
            }
          }

          await Message.create({
            conversationId: conversation.id,
            sender: 'bot',
            text: fullText,
            timestamp: new Date()
          });

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'bot_complete',
                payload: { id: botMessageId }
              })
            );
          }
        }
      } catch (e) {
        logger.error('WS message handling error', { e });
      }
    });
  });

  logger.info('WebSocket server initialized at /ws/chat');
}


