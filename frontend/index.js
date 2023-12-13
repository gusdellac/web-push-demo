console.log("Prueba cache");

const check = () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("No Service Worker support!");
  }
  if (!("PushManager" in window)) {
    throw new Error("No Push API Support!");
  }
};

// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
const urlB64ToUint8Array = base64String => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const saveSubscription = async subscription => {
  const SERVER_URL = "http://localhost:4000/save-subscription";
  const response = await fetch(SERVER_URL, {
    method: "post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
  return response.json();
};

const registerServiceWorker = async () => {
  const swRegistration = await navigator.serviceWorker.register("service.js");
  console.log("se registro el service worker");
  return swRegistration;
};

//subscribir notificaciones
async function subscribeToNotifications() {
  const swRegistration = await registerServiceWorker();

  navigator.serviceWorker.ready
  .then(registration => registration.pushManager.getSubscription())
  .then(async existingSubscription => {

    if (existingSubscription) {
      console.log("existe subscripcion");

    } else {
      swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BJ5IxJBWdeqFDJTvrZ4wNRu7UY2XigDXjgiUBYEYVXDudxhEs0ReOJRBcBHsPYgZ5dyV8VjyqzbQKS8V7bUAglk",
      })
      .then( async (newSubscription) => {
        const response = await saveSubscription(newSubscription);
        console.log(response);
        console.log("¡Suscribed!");
      })
      .catch(error => {
        console.error('Error al suscribirse a las notificaciones:', error);
      });
    }
  })
  .catch(error => {
    console.error('Error al obtener el registro del Service Worker:', error);
  });
}



const requestNotificationPermission = async () => {
  const permission = await window.Notification.requestPermission();
  // value of permission can be 'granted', 'default', 'denied'
  // granted: user has accepted the request
  // default: user has dismissed the notification permission popup by clicking on x
  // denied: user has denied the request.
  if (permission !== "granted") {
    throw new Error("Permission not granted for Notification");
  }
};

const main = async () => {
  check();
  const permission = await requestNotificationPermission();
  const notRegistration = await subscribeToNotifications();
};
// main(); we will not call main in the beginning.
