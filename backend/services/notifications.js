const ONESIGNAL_APP_ID = '76f4a464-6f32-4364-ae9b-d39b8223087f';
const SHOP_URL = 'https://norahairline.up.railway.app/shop';

async function sendPush(heading, content) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!apiKey) {
    console.log('ONESIGNAL_REST_API_KEY not set — skipping push notification');
    return;
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: heading },
        contents: { en: content },
        url: SHOP_URL,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('OneSignal error:', JSON.stringify(data));
    } else {
      console.log(`Push notification sent — id: ${data.id}, recipients: ${data.recipients}`);
      if (data.recipients === 0) {
        console.warn('OneSignal: 0 recipients — no one has subscribed to push notifications yet');
      }
    }
    return data;
  } catch (err) {
    console.error('OneSignal request failed:', err.message);
    throw err;
  }
}

function sendNewProductNotification(productName) {
  return sendPush('Nora Hair Line', `New arrival: ${productName} 💛 Shop now at Nora Hair Line!`);
}

function sendFlashSaleNotification() {
  return sendPush('🔥 Flash Sale — Nora Hair Line', 'A flash sale is live right now! Grab your favourites before time runs out 🛍️');
}

module.exports = { sendNewProductNotification, sendFlashSaleNotification };
