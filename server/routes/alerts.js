import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAlerts } from '../services/alertsService.js';

const router = Router();
router.use(authenticateToken);

// GET /api/alerts — returns proactive alerts for the authenticated user
router.get('/', async (req, res) => {
    try {
        const alerts = await getAlerts(req.user.id);
        res.json(alerts);
    } catch (err) {
        console.error('GET /alerts error:', err);
        res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
});

export default router;
