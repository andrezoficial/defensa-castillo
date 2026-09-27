# 🏰 Defensa del Castillo

Juego de defensa de torres (*tower defense*) con temática medieval, hecho con [Phaser 3](https://phaser.io/). Sin dependencias de build: HTML + CSS + JS planos.

## Cómo jugarlo

Solo hace falta un servidor estático (por CORS, no basta con abrir `index.html` con doble clic en algunos navegadores):

```bash
# opción rápida con Python
python3 -m http.server 8000
# abrir http://localhost:8000
```

O publícalo con **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / `/(root)`. Al ser HTML estático funciona tal cual.

## Estructura

```
defensa-castillo/
├── index.html          # estructura y HUD
├── css/styles.css       # tema visual (piedra, madera, pergamino)
└── js/
    ├── config.js        # mapa, torres, enemigos, reglas de mejora/venta/jefes
    ├── state.js          # estado mutable de una partida
    ├── ui.js              # HUD animado, panel de torre, pausa/velocidad
    ├── entities.js       # enemigos, jefes, refuerzos, partículas
    ├── towers.js          # colocación, mejora, venta, disparo y proyectiles
    ├── scene.js           # escena de Phaser (mapa, castillo, antorchas)
    └── main.js            # arranque
```

Cada aspecto del juego vive en su propio archivo: para agregar una torre o un enemigo nuevo, alcanza con tocar `config.js` (y `index.html` para el botón, si aplica).

## Características

- **Temática medieval**: paleta de piedra/madera/pergamino, tipografía Cinzel/MedievalSharp, camino de tierra, castillo con torreones y antorchas parpadeantes.
- **3 torres**: Arqueros (daño directo), Hechicero (ralentiza), Catapulta (daño en área).
- **Mejora y venta de torres**: toca una torre colocada para subirla de nivel (hasta nivel 3) o venderla por parte de lo invertido.
- **Jefes cada 5 oleadas**: el Rey Ogro tiene mucha vida, es inmune a la ralentización e invoca refuerzos al bajar de la mitad de su vida.
- **Vista previa de rango** al elegir dónde colocar una torre (verde/rojo según sea válido).
- **HUD animado**: el oro y la vida muestran un `+N`/`-N` flotante al cambiar.
- **Pausa** y **velocidad x2** para agilizar oleadas lentas.

## Licencia

Phaser se carga desde cdnjs bajo su propia licencia (MIT). El resto del código es de uso libre para este proyecto.
