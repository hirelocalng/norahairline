// Delivery states and fees. Keep in sync with NIGERIA_STATES/getDeliveryFee
// in frontend/src/pages/Checkout.jsx — the server's numbers are what's saved.
const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos Mainland', 'Lagos Island',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

function getDeliveryFee(state) {
  if (state === 'Lagos Mainland') return 4000;
  if (state === 'Lagos Island') return 5000;
  return 5000;
}

module.exports = { NIGERIA_STATES, getDeliveryFee };
