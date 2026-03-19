import { Router } from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro pessoal brasileiro. Forneça conselhos personalizados sobre finanças pessoais, orçamentos, economias e investimentos. Use linguagem amigável e exemplos práticos com valores em reais (R$). Seja conciso e direto.`;

router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(Array.isArray(history) ? history : []),
            { role: 'user', content: message },
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content ||
            'Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.';

        res.json({ response });
    } catch (err) {
        console.error('Erro na API de IA:', err);
        res.status(500).json({ error: 'Erro ao processar solicitação de IA' });
    }
});

export default router;
