import WebSocket from 'ws';
import { logger } from '../utils/logger';

export class AiWsClient {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  streamCompletion(prompt: string, onToken: (token: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);

      ws.on('open', () => {
        ws.send(JSON.stringify({ prompt }));
      });

      ws.on('message', (data) => {
        try {
          const msg = data.toString();
          if (msg === '[END]') {
            ws.close();
            resolve();
          } else {
            onToken(msg);
          }
        } catch (e) {
          logger.error('Error parsing AI WS message', { e });
        }
      });

      ws.on('error', (err) => {
        logger.error('AI WS error', { err });
        reject(err);
      });

      ws.on('close', () => {
        resolve();
      });
    });
  }
}


