import { Response } from 'express';
import { AuthedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export async function me(req: AuthedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo
  });
}


