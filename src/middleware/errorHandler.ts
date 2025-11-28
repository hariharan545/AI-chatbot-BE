import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'Internal server error' });
}


