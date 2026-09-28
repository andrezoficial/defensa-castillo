# 🏰 Defensa del Castillo — Edición 3D

Versión 3D del tower defense, hecha con [Three.js](https://threejs.org/) (r128, desde cdnjs). Sin build: HTML + CSS + JS planos.

## Jugar
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```
También funciona en GitHub Pages.

## Controles
Clic/arrastre para construir · clic en torre para mejorar/vender · `1-3` torres · `Espacio` oleada · `P` pausa · `Q/E` girar cámara · rueda del mouse: zoom.

## Estructura
`config.js` (balance, mapa) · `state.js` · `ui.js` (HUD) · `engine3d.js` (mundo 3D, modelos, torres, enemigos, efectos) · `main.js`.
El mapa conserva las coordenadas 2D (x→X, y→Z), por lo que todo el balance sigue igual. Los modelos GLB (`assets/models/`, aligerados con color por vértice) son: arquero y hechicero sobre sus torres, catapulta, goblin, orco guerrero y orco (también jefe, ×2) y castillo. Cargados con `GLTFLoader`.
