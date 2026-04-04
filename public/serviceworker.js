if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/serviceworker.js")
      .then((reg) => {
        console.log("¡Baúl listo para instalar!", reg.scope);
      })
      .catch((err) => {
        console.log("Fallo en el registro", err);
      });
  });
}
