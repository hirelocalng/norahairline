const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = 'onboarding@resend.dev';
const WA = '08038707795';

const TEAL = '#0D4A47';
const GOLD = '#C9A84C';

function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:${TEAL};padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;color:${GOLD};font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nora Hair Line</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">${title}</h1>
          <div style="margin-top:12px;height:1px;background:linear-gradient(to right,transparent,${GOLD},transparent);opacity:0.6;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0 0 4px;color:#888;font-size:12px;">Nora Hair Line &bull; Trade Fair Complex, Lagos, Nigeria</p>
          <p style="margin:0;color:#888;font-size:12px;">WhatsApp: ${WA} &bull; <a href="https://linktr.ee/norahairline_" style="color:${TEAL};">linktr.ee/norahairline_</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOrderConfirmation(order) {
  if (!order.customer_email) return;

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = parseFloat(order.total) - subtotal;

  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;color:#333;">${i.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;color:#555;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;color:#333;text-align:right;white-space:nowrap;">₦${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  const body = `
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
      Hi <strong>${order.customer_name}</strong>, thank you for your order!
      We've received it and will confirm availability and arrange delivery for you.
    </p>

    <h3 style="margin:0 0 12px;color:${TEAL};font-size:14px;letter-spacing:1px;text-transform:uppercase;">Order #${order.id}</h3>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background:${TEAL};">
          <th style="padding:10px 8px;color:#fff;font-size:12px;text-align:left;font-weight:600;">Item</th>
          <th style="padding:10px 8px;color:#fff;font-size:12px;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:10px 8px;color:#fff;font-size:12px;text-align:right;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:#666;font-size:14px;">Subtotal</td>
        <td style="padding:4px 0;color:#333;font-size:14px;text-align:right;">₦${subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;font-size:14px;">Delivery</td>
        <td style="padding:4px 0;color:#333;font-size:14px;text-align:right;">₦${deliveryFee.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 4px;color:${TEAL};font-size:16px;font-weight:bold;border-top:1px solid #eee;">Total</td>
        <td style="padding:8px 0 4px;color:${TEAL};font-size:16px;font-weight:bold;border-top:1px solid #eee;text-align:right;">₦${parseFloat(order.total).toLocaleString()}</td>
      </tr>
    </table>

    <div style="background:#f8fffe;border:1px solid #d0e8e6;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;color:${TEAL};font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Delivery Details</p>
      <p style="margin:0;color:#444;font-size:14px;line-height:1.7;">
        ${order.customer_name}<br>
        ${order.customer_phone}<br>
        ${order.customer_address}<br>
        ${order.customer_state}
      </p>
    </div>

    <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
      Questions? Chat us on WhatsApp: <a href="https://wa.me/234${WA.replace(/^0/, '')}" style="color:${TEAL};font-weight:bold;">${WA}</a>
    </p>`;

  if (!resend || !order.customer_email) return;
  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `Nora Hair Line – Order #${order.id} Confirmed`,
    html: baseTemplate('Order Received!', body),
  });
}

async function sendStatusUpdate(order, status) {
  if (!order.customer_email) return;

  const messages = {
    confirmed: `Your order <strong>#${order.id}</strong> has been confirmed! We will contact you shortly for delivery details.`,
    shipped:   `Your order <strong>#${order.id}</strong> has been shipped! You will receive it soon.`,
    delivered: `Your order <strong>#${order.id}</strong> has been delivered! Thank you for shopping with Nora Hair Line. We hope to see you again!`,
    cancelled: `Your order <strong>#${order.id}</strong> has been cancelled. Please contact us on WhatsApp: <a href="https://wa.me/234${WA.replace(/^0/, '')}" style="color:${TEAL};">${WA}</a> for assistance.`,
  };

  const titles = {
    confirmed: 'Order Confirmed',
    shipped:   'Order Shipped',
    delivered: 'Order Delivered',
    cancelled: 'Order Cancelled',
  };

  const iconColors = {
    confirmed: '#22c55e',
    shipped:   '#3b82f6',
    delivered: TEAL,
    cancelled: '#ef4444',
  };

  const msg = messages[status];
  if (!msg) return;

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${iconColors[status]}22;line-height:56px;font-size:28px;">
        ${{ confirmed: '✅', shipped: '🚚', delivered: '🎉', cancelled: '❌' }[status]}
      </div>
    </div>
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.7;text-align:center;">${msg}</p>
    <div style="background:#f8fffe;border:1px solid #d0e8e6;border-radius:8px;padding:14px;text-align:center;margin-bottom:20px;">
      <p style="margin:0;color:#666;font-size:13px;">Order total: <strong style="color:${TEAL};">₦${parseFloat(order.total).toLocaleString()}</strong></p>
    </div>
    <p style="margin:0;color:#888;font-size:13px;line-height:1.6;text-align:center;">
      Need help? WhatsApp us: <a href="https://wa.me/234${WA.replace(/^0/, '')}" style="color:${TEAL};font-weight:bold;">${WA}</a>
    </p>`;

  if (!resend || !order.customer_email) return;
  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `Nora Hair Line – Order #${order.id} Update`,
    html: baseTemplate(titles[status], body),
  });
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
