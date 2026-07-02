import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPlans, getSubscription, getUsage, setSubscription } from '../services/subscriptionService.js';

const router = Router();

router.get('/plans', (_req, res) => {
  res.json({ plans: getPlans() });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    subscription: getSubscription(req.user.id),
    usage: getUsage(req.user.id)
  });
});

router.post('/checkout/mock', requireAuth, (req, res, next) => {
  try {
    const subscription = setSubscription(req.user.id, req.body.planId);

    res.json({
      ok: true,
      message: 'Mock checkout complete. Replace this route with Stripe/Razorpay in production.',
      subscription
    });
  } catch (error) {
    next(error);
  }
});

export default router;
