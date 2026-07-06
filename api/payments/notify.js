/**
 * POST /api/payments/notify
 * Webhook desde Redsys tras completar (o denegar) un pago.
 * NO requiere auth — la seguridad viene por la firma HMAC-SHA256 del payload.
 */
import { methodDispatch, ok } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { Payment, User, ActivityLog } from '../_lib/models.js';
import { verifyNotification } from '../_lib/payments/redsys.js';

export default methodDispatch({
  POST: async (req, res) => {
    const v = verifyNotification(req.body);

    if (!v.valid) {
      console.warn('[Redsys notify] Firma inválida:', { orderId: v.orderId });
      return res.status(400).send('FIRMA_INVALIDA');
    }

    await connectMongo();

    const order = await Payment.findOne({ order_id: v.orderId });
    if (!order) {
      console.warn('[Redsys notify] Orden no encontrada:', v.orderId);
      return res.status(404).send('ORDEN_NO_ENCONTRADA');
    }

    if (order.status !== 'pendiente') return res.send('OK');

    order.status = v.status;
    order.response_code = v.response_code;
    order.authorization_code = v.authorization_code;
    order.completed_at = new Date();
    await order.save();

    // Si aprobado y es plan → activar membresía
    if (v.status === 'aprobado' && (order.concept === 'profesional' || order.concept === 'premium')) {
      await User.findByIdAndUpdate(order.user_id, { membership: order.concept });
    }

    await ActivityLog.create({
      user_id: order.user_id,
      action: 'payment_' + v.status,
      entity: 'payment',
      entity_id: v.orderId,
      details: `${order.method} · ${order.concept} · ${order.amount/100} € · ${v.response_reason || ''}`.trim(),
      ip_address: req.headers['x-forwarded-for'] || 'unknown',
    });

    res.send('OK');
  },
});
