const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';
const SHOP_URL = 'https://norahairline.up.railway.app/shop';

async function sendPush(heading, content) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId  = process.env.ONESIGNAL_APP_ID;

  console.log('[OneSignal] sendPush called:', heading);
  console.log('[OneSignal] ONESIGNAL_APP_ID set:', !!appId);
  console.log('[OneSignal] ONESIGNAL_REST_API_KEY set:', !!apiKey);

  if (!apiKey) {
    console.error('[OneSignal] ONESIGNAL_REST_API_KEY is not set — cannot send push');
    return null;
  }
  if (!appId) {
    console.error('[OneSignal] ONESIGNAL_APP_ID is not set — cannot send push');
    return null;
  }

  const payload = {
    app_id: appId,
    included_segments: ['All'],
    headings: { en: heading },
    contents: { en: content },
    url: SHOP_URL,
  };

  console.log('[OneSignal] Sending payload:', JSON.stringify(payload));

  let res, data;
  try {
    res = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    data = await res.json();
  } catch (err) {
    console.error('[OneSignal] Network/fetch error:', err.message);
    throw err;
  }

  if (!res.ok) {
    console.error('[OneSignal] API returned error status', res.status, ':', JSON.stringify(data));
    throw new Error(data.errors?.[0] || `OneSignal API error ${res.status}`);
  }

  console.log(`[OneSignal] Success — notification id: ${data.id}, recipients: ${data.recipients}`);
  if (data.recipients === 0) {
    console.warn('[OneSignal] 0 recipients — no users have opted in to push notifications yet');
  }

  return data;
}

// Trigger 1: new product added
function sendNewProductNotification(productName) {
  console.log('[OneSignal] Triggering new product notification for:', productName);
  return sendPush(
    'New Arrival! 🛍️',
    `${productName} is now available — Shop now at Nora Hair Line!`
  );
}

// Trigger 2: flash sale activated
function sendFlashSaleNotification() {
  console.log('[OneSignal] Triggering flash sale notification');
  return sendPush(
    '⚡ Flash Sale is LIVE!',
    "Don't miss out — amazing deals are waiting for you. Shop now!"
  );
}

module.exports = { sendNewProductNotification, sendFlashSaleNotification };
