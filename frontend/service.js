const CACHE_NAME = 'CACHE-WEBPUSH';


//se ejecuta cuando se installa el sw
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      return await cache.addAll(["prueba.js"])
      .catch(error => {
        console.error('Error al agregar recursos a la caché:', error);
      });
    })
  );
  
  // Se activa e instala la nueva versión automáticamente
  self.skipWaiting();
});

//se ejecuta cuando se activa el sw
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );

  // Toma el control de todas las páginas abiertas
  self.clients.claim();
});


//se ejecuta cuando se hace una peticion de recursos
self.addEventListener('fetch', event => {
  console.log("Peticion de recursos!");
  console.log(event);
  event.respondWith(
    caches.match(event.request).then(async cachedResponse => {
      if (cachedResponse) {
        // El recurso está en caché, verifica la marca de tiempo
        return fetch(event.request).then(response => {
          const lastModifiedHeader = response.headers.get('last-modified');
         
          if (lastModifiedHeader) {
            const serverLastModified = new Date(lastModifiedHeader);
            const cachedLastModified = new Date(cachedResponse.headers.get('last-modified'));
        
            // Ajusta ambas fechas a UTC
            const serverLastModifiedUTC = new Date(serverLastModified.toUTCString());
            const cachedLastModifiedUTC = new Date(cachedLastModified.toUTCString());
            
            console.log("Last modified recurso server: " + serverLastModifiedUTC);
            console.log("Last modified recurso cache: " + cachedLastModifiedUTC);
        
            // Comprueba si el recurso en caché está desactualizado
            if (serverLastModifiedUTC > cachedLastModifiedUTC) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response.clone());
                console.log("Se devolvió el recurso nuevo");
              });
            }
          }
          return cachedResponse;
        });
      }

      // El recurso no está en caché, realiza la solicitud al servidor
      return fetch(event.request);
    })
  );
});


//devuelve solo el recurso en cache si existe
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       return response || fetch(event.request);
//     })
//   );
// });


//si existe una nueva version del sw se activa inmediatamente
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

/*
al ejecutarse el evento push por una notificacion recibida desde el servidor mostrara la notificacion
y enviara un mensaje a la pagina principal (index) con la accion que debe realizar
*/
self.addEventListener("push", e => {
    const data = e.data.json();

    //Mostrar notificacion push
    self.registration.showNotification(data.title, {
        body: data.message,
    });

    // Envía un mensaje a la página principal
    // e.waitUntil(
    //   self.clients.matchAll({ type: 'window' }).then(function(clients) {
    //     if (clients && clients.length) {
    //       // Envia un mensaje a la primera ventana activa
    //       clients[0].postMessage({ action: data.action });
    //     }
    //   })
    // );
});

//accion al hacer  click sobre la notificacion
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Envía un mensaje a la página principal
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      if (clients && clients.length) {
        // Envia un mensaje a la primera ventana activa
        clients[0].postMessage({ action: 'notificationClicked' });
      }
    })
  );
});





// Maneja el clic en la notificación
// self.addEventListener('notificationclick', function(event) {
//     const action = event.action;
  
//     switch (action) {
//       case 'open-website':
//         // Abre la URL especificada cuando se hace clic en la acción
//         clients.openWindow(event.notification.data.url);
//         break;
//       // ... Maneja otras acciones ...
//       default:
//         console.log('Clic en la notificación sin una acción específica');
//     }
  
//     // Cierra la notificación
//     event.notification.close();
//   });



