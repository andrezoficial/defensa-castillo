# 🏰 Defensa del Castillo — Edición 3D

Tower defense medieval en 3D con [Three.js](https://threejs.org/) r128. Sin build: HTML + CSS + JS planos, con las librerías incluidas en `js/vendor/` (funciona sin conexión, salvo la tipografía).

## Jugar
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```
Necesita un servidor (no funciona abriendo `index.html` con doble clic, porque el navegador bloquea la carga de los modelos `.glb`). También funciona en GitHub Pages.

## Objetivo
Sobrevive **15 oleadas** para ganar; después puedes seguir en **modo sin fin** (los enemigos ganan vida extra desde la oleada 11). Cada 5 oleadas llega el Trabuquete Real: si alcanza el castillo cuesta 5 vidas.

## Controles
| Acción | Ratón / táctil | Teclado |
|---|---|---|
| Elegir torre | Botones inferiores | `1` `2` `3` |
| Construir | Toca/arrastra a una casilla y suelta (soltar fuera del mapa cancela) | — |
| Cancelar selección | Clic derecho | `Esc` |
| Mejorar / vender | Toca una torre | — |
| Iniciar oleada | Botón | `Espacio` |
| Pausa | Botón Ⅱ | `P` (también se pausa sola al cambiar de pestaña) |
| Cámara | Botones ⟲ ⟳ + − del mapa · rueda | `Q` / `E` |
| Sonido | Botón ♪ (se recuerda) | — |

## Estructura
- `js/config.js` — balance, mapa, torres, victoria y dificultad.
- `js/state.js` — estado de la partida (`GameState`) y `canAct()`.
- `js/audio.js` — efectos de sonido sintetizados con WebAudio.
- `js/ui.js` — HUD, paneles, menús y eventos del DOM.
- `js/engine3d.js` — mundo 3D, modelos, torres, enemigos, efectos y bucle.
- `js/vendor/` — `three.min.js` y `GLTFLoader.js` (r128, licencia MIT).
- `assets/models/` — modelos GLB (arquero, hechicero, catapulta, goblin, orco guerrero, orco/jefe, castillo).

El mapa conserva las coordenadas 2D (x→X, y→Z) para que el balance sea sencillo de ajustar.

> `assets/sprites/` y `assets/kenney/` son restos de la versión 2D con Phaser y ya no se usan; se pueden borrar.
