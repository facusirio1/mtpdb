/**
 * POST /api/payments/redsys/create
 * Body: { concept: 'profesional'|'premium'|'nft' }
 * Response: form data para POST hacia Redsys
 */
import { methodDispatch, requireAuth, badRequest, ok } from '../../_lib/helpers.js';
import { connectMongo } from '../../_lib/db.js';
import { Payment } from '../../_lib/models.js';
import { createPayment, generateOrderId } from '../../_lib/payments/redsys.js';

const PRICES = {
  profesional: { amount: 2900, label: 'Plan Profesional' },
  premium:     { amount: 7900, label: 'Plan Premium' },
  nft:         { amount: 500,  label: 'Certificado NFT' },
};

export default methodDispatch({
  POST: async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { concept } = req.body || {};
    if (!PRICES[concept]) return badRequest(res, 'Concept inválido');

    await connectMongo();

    const orderId = generateOrderId();
    const { amount, label } = PRICES[concept];

    await Payment.create({
      order_id: orderId,
      user_id: user.id,
      method: 'redsys',
      concept,
      amount,
      status: 'pendiente',
    });

    const form = createPayment({
      orderId,
      amount,
      description: label,
      userId: user.id,
    });

    return ok(res, {
      order_id: orderId,
      amount,
      form,
    });
  },
});
