import { Router } from 'express';
import passport from 'passport';
import { googleAuth, googleCallback } from '../controllers/authController';

const router = Router();

router.use(passport.initialize());

router.get('/google', googleAuth);
router.get('/google/callback', ...googleCallback);

export default router;


