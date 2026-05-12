const ONESIGNAL_APP_ID = '76f4a464-6f32-4364-ae9b-d39b8223087f';

async function sendNewProductNotification(productName) {
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
        headings: { en: 'Nora Hair Line' },
        contents: { en: 'New arrival at Nora Hair Line! Check it out 💛' },
        url: 'https://norahairline.up.railway.app/shop',
      }),
    });

    const data = await res.json();
    if (!res.ok) console.error('OneSignal error:', data);
    else console.log('Push notification sent, id:', data.id);
  } catch (err) {
    console.error('OneSignal request failed:', err.message);
  }
}

module.exports = { sendNewProductNotification };
