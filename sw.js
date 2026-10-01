const CACHE = "defensa-castillo-v7.6-mapa-realista";
const CORE = ["./", "./index.html", "./css/styles.css", "./js/config.js", "./js/state.js", "./js/settings.js", "./js/audio.js", "./js/music.js", "./js/ui.js", "./js/engine3d.js", "./js/v6.js", "./js/v65.js", "./js/v69.js", "./js/fx.js", "./js/bosses.js", "./js/skills.js", "./js/progress.js", "./js/ambience.js", "./js/save.js", "./js/main.js", "./js/vendor/three.min.js", "./js/vendor/GLTFLoader.js", "./manifest.webmanifest", "./assets/models/archer.glb", "./assets/models/wizard.glb", "./assets/models/catapult.glb", "./assets/models/goblin.glb", "./assets/models/zombie.glb", "./assets/models/wyvern.glb", "./assets/models/raider.glb", "./assets/models/ogre.glb", "./assets/models/solani.glb", "./assets/models/castle.glb", "./icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // tipografías y otros orígenes: que los gestione el navegador
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    // Solo se guardan respuestas correctas (antes un 404/500 quedaba en caché para siempre).
    if (res && res.status === 200 && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : Response.error()))); // index.html solo como respaldo de páginas, no de scripts o modelos
});
