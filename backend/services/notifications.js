const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';
const SHOP_URL = 'https://norahairline.up.railway.app/shop';

async function sendPush(heading, content) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId  = process.env.ONESIGNAL_APP_ID;

  if (!apiKey || !appId) {
    console.warn('[OneSignal] ONESIGNAL_REST_API_KEY or ONESIGNAL_APP_ID not set — skipping push');
    return null;
  }

  const payload = {
    app_id: appId,
    included_segments: ['All'],
    headings: { en: heading },
    contents: { en: content },
    url: SHOP_URL,
  };

  const res = await fetch(ONESIGNAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('[OneSignal] API error:', JSON.stringify(data));
    throw new Error(data.errors?.[0] || 'OneSignal request failed');
  }

  console.log(`[OneSignal] Notification sent — id: ${data.id}, recipients: ${data.recipients}`);
  if (data.recipients === 0) {
    console.warn('[OneSignal] 0 recipients — no subscribers have opted in yet');
  }

  return data;
}

// Trigger 1: new product added
function sendNewProductNotification(productName) {
  return sendPush(
    'New Arrival! 🛍️',
    `${productName} is now available — Shop now at Nora Hair Line!`
  );
}

// Trigger 2: flash sale activated
function sendFlashSaleNotification() {
  return sendPush(
    '⚡ Flash Sale is LIVE!',
    "Don't miss out — amazing deals are waiting for you. Shop now!"
  );
}

module.exports = { sendNewProductNotification, sendFlashSaleNotification };
