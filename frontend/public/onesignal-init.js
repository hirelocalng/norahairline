// OneSignal web push setup. Kept out of index.html so the Content-Security-Policy
// can forbid inline scripts.
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "76f4a464-6f32-4364-ae9b-d39b8223087f",
    serviceWorkerParam: { scope: "/" },
    serviceWorkerPath: "OneSignalSDKWorker.js",
    notifyButton: {
      enable: true,
      size: "medium",
      position: "bottom-right",
      showCredit: false,
      text: {
        "tip.state.unsubscribed": "Get notified about new arrivals & sales",
        "tip.state.subscribed": "You're subscribed to notifications",
        "tip.state.blocked": "Notifications are blocked",
        "message.prenotify": "Click to subscribe to notifications",
        "message.action.subscribed": "Thanks for subscribing!",
        "message.action.resubscribed": "You're subscribed to notifications",
        "message.action.unsubscribed": "You won't receive notifications anymore",
      },
    },
  });

  // Hide the bell widget once the user has subscribed
  OneSignal.User.PushSubscription.addEventListener("change", function(event) {
    if (event.current.optedIn) {
      var bell = document.getElementById("onesignal-bell-container");
      if (bell) bell.style.display = "none";
    }
  });

  // Also hide immediately if already subscribed on page load
  var isSubscribed = OneSignal.User.PushSubscription.optedIn;
  if (isSubscribed) {
    var bell = document.getElementById("onesignal-bell-container");
    if (bell) bell.style.display = "none";
  }
});
