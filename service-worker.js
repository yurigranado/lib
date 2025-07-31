// service-worker.js
self.addEventListener("push", (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "https://i.imgur.com/VpQtXGy.png", // ícone Lib
  });
});
