# 🏰 Defensa del Castillo — V5.0

Tower defense medieval en 3D con [Three.js](https://threejs.org/) r128. Sin build: HTML + CSS + JS planos, con las librerías incluidas en `js/vendor/` (funciona sin conexión, salvo la tipografía).

## Jugar
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```
Necesita un servidor (no funciona abriendo `index.html` con doble clic, porque el navegador bloquea la carga de los modelos `.glb`). También funciona en GitHub Pages.

## Objetivo
Sobrevive **15 oleadas** para ganar; después puedes seguir en **modo sin fin** (los enemigos ganan vida extra desde la oleada 11). Cada 5 oleadas llega un **jefe por fases** (Trabuquete Real, Coloso Blindado, Señor del Eclipse): si alcanza el castillo cuesta 5 vidas.

## Controles
| Acción | Ratón / táctil | Teclado |
|---|---|---|
| Elegir torre | Botones inferiores | `1` `2` `3` |
| Construir | Toca/arrastra a una casilla y suelta (soltar fuera del mapa cancela) | — |
| Cancelar selección | Clic derecho | `Esc` |
| Mejorar / vender | Toca una torre | — |
| Iniciar oleada | Botón | `Espacio` |
| Mejorar / vender / cambiar objetivo de la torre elegida | Botones del panel | `U` / `V` / `T` |
| Elegir especialización (torre nivel 3) | Toca una opción para ver qué hace, otra vez para confirmar | `1` / `2` |
| Habilidades activas | Botones ☄ ❄ ⚡ (abajo a la derecha del mapa) | `Z` / `X` / `C` |
| Velocidad ×2 | Botón » | `F` |
| Pausa | Botón Ⅱ | `P` (también se pausa sola al cambiar de pestaña) |
| Cámara | Botones ⟲ ⟳ + − del mapa · rueda | `Q` / `E` |
| Sonido | Botón ♪ (se recuerda) | — |

## Novedades de la V5.0

### 💾 Guardado
La partida se guarda sola **al terminar cada oleada** (mapa, oleada, oro, vidas, bajas y todas las torres con nivel, especialización y objetivo). En la pantalla de inicio aparece **CONTINUAR · OLEADA N**; si la partida es de otro mapa, lo cambia y recarga solo. Se borra al ganar o perder. Cuando la pestaña pasa a segundo plano entre oleadas también guarda. Lógica en `js/save.js` (clave `defensa-castillo-run`).

### ⚙️ Configuración
Botón **⚙** (barra superior y pantalla de inicio): volumen de música y de efectos, calidad gráfica (automática / baja / alta), sombras, números de daño, sacudida de cámara, vibración, pantalla completa, borrar la partida guardada y reiniciar el progreso del reino. Se recuerda (`defensa-castillo-settings`). Abrirlo en partida la pausa. `js/settings.js`.

### 📱 Pulido móvil
Márgenes de seguridad (notch y barras), barra compacta en horizontal con poca altura, botones táctiles más grandes, sin selección de texto ni menú contextual al mantener pulsado, pantalla siempre encendida mientras juegas (Wake Lock), vibración al colarse un enemigo, pantalla completa con bloqueo a horizontal y aviso para girar el móvil.

### 🔊 Música
Música **procedural** (WebAudio, sin archivos): *calma* en el menú y entre oleadas, *batalla* durante las oleadas y *jefe* (más rápida y oscura, en Re menor) con jefes. Cambia al inicio de un compás, se atenúa en pausa, se silencia al ocultar la pestaña y respeta el botón ♪. `js/music.js`.

### 🎨 Ambientación
Cielo y niebla propios de cada mapa; **ciclo de luz según la oleada** (alba → mediodía → ocaso → eclipse desde la 15) con tinte rojizo en las oleadas de jefe; luciérnagas (Valle) o ascuas violetas (Paso) flotando, y braseros con llama junto a la entrada y al castillo. `js/ambience.js`.

## Novedades de la V4.1

### 🗺️ Segundo mapa
**Paso del Eclipse**: camino largo y sinuoso con paleta crepuscular. Enemigos con +20 % de vida, +50 oro iniciales y coronas ×1,5. Se desbloquea al ganar el **Valle del Alba** (≥ 1 ★). El mapa se elige en **👑 REINO** (recarga la página); los mapas viven en `MAPS` (`js/config.js`), así que añadir uno es solo añadir una entrada.

### ⭐ Estrellas
Al ganar (oleada 15) recibes de 1 a 3 estrellas según las vidas que conserves: **≥ 90 % = ★★★**, **≥ 50 % = ★★**, el resto ★. Se guarda la mejor de cada mapa y se muestra en el panel del Reino y en la pantalla de victoria.

### 🏆 Logros
12 logros (Centurión, Cazajefes, Muralla intacta, Maestro armero, Gran hechicero, Perfecto, Explorador, Sin final…). Cada uno da **+5 👑** y avisa al desbloquearse.

### 💰 Economía y progresión
Las **coronas 👑** se ganan por oleada superada (+2, +5 con jefe), por bajas (1 cada 20), por victoria (10 + 5 por ★) y por logros; en el Paso del Eclipse ×1,5. Se gastan en mejoras permanentes (5 niveles cada una, cada nivel más caro): **Tesoro real** (+25 oro inicial), **Murallas reforzadas** (+2 vidas), **Botín de guerra** (+5 % oro por baja) y **Maestría arcana** (−6 % enfriamiento de habilidades). Todo se guarda en `localStorage` (`defensa-castillo-save`). Lógica en `js/progress.js`.

## Novedades de la V4.0

### ⚔️ Habilidades activas
Tres poderes con enfriamiento (se cuenta en tiempo de juego: respeta pausa y ×2):
| Habilidad | Efecto | Enfriamiento |
|---|---|---|
| ☄ **Meteoro** (`Z`) | Eliges un punto: cae un meteoro tras un aviso en el suelo. Daño en zona (escala con la oleada) y quema. En móvil, arrastra para apuntar y suelta. | 30 s |
| ❄ **Escarcha** (`X`) | Congela a todos los enemigos 3 s (los jefes solo se ralentizan). | 40 s |
| ⚡ **Furia Real** (`C`) | Todas las torres disparan un 70 % más rápido durante 7 s. | 45 s |

### 🧙 Especializaciones de torre
Al llegar al nivel 3, cada torre elige **un** camino (cuesta oro y es permanente):
| Torre | Camino A | Camino B |
|---|---|---|
| Arqueros | **Francotirador** — alcance +45 %, daño ×2,4, críticos 30 %, ignora armadura, dispara más lento | **Ráfaga** — dispara a 3 enemigos a la vez y más rápido |
| Hechicero | **Glacial** — ralentiza mucho más y más tiempo (también jefes); cada 5 hechizos congela | **Tormenta** — rayo encadenado que salta entre 4 enemigos |
| Catapulta | **Bombardera** — explosión +60 % mayor y daño ×1,5, más lenta | **Incendiaria** — prende fuego 4 s a todos los alcanzados |

La torre especializada muestra una gema giratoria y un anillo del color de su camino.

### 👹 Nuevos enemigos
| Enemigo | Aparece | Qué hace |
|---|---|---|
| **Plaga** | oleada 3 | Muy rápidos y numerosos, salen en bloque. La catapulta los barre. |
| **Saboteador** | oleada 4 | Desactiva la torre más cercana ~3 s cada pocos segundos. Prioridad máxima. |
| **Chamán** | oleada 6 | Cura a los aliados a su alrededor (anillo verde). |
| **Espectro** | oleada 8 | Etéreo: resiste flechas y asedio (50 %) pero es vulnerable a la magia (+30 %). |

La primera vez que sale cada uno aparece un aviso con su consejo. El botón de oleada resume cuántos especiales vienen.

### 👑 Jefes por fases
Cada jefe tiene su propio aspecto, vida y fases. Al bajar de cierto % de vida queda **invulnerable ~1,3 s**, se anuncia la fase y ejecuta sus acciones. Hay una barra de vida del jefe con marcas de fase y barra de escudo.
| Oleada | Jefe | Fases |
|---|---|---|
| 5, 20… | **Trabuquete Real** | 66 % refuerzos · 33 % furia + pisotones |
| 10, 25… | **Coloso Blindado** | 75 % escudo arcano · 50 % legión (saboteadores + chamán) · 25 % furia + escudo |
| 15, 30… | **Señor del Eclipse** | 80 % espectros · 55 % temblor (pisotones) + escudo · 30 % eclipse (furia + legión + espectros) |

El **escudo** absorbe daño antes que la vida y hay que romperlo. El **pisotón** aturde las torres cercanas ~2 s.

### 💥 Mejores efectos de combate
- Números de daño flotantes (críticos en dorado, quemadura en naranja, escudo en azul). Todas las torres tienen 8 % de crítico (×1,75).
- Estelas en proyectiles y destello de disparo; explosiones con bola de fuego, onda, escombros, humo, luz y marca quemada en el suelo.
- Rayos con trazo irregular; destello de golpe en el enemigo; hielo, llamas y brasas sobre los enemigos afectados.
- Muerte específica por tipo (espectros se elevan, chamanes sueltan una onda verde, saboteadores explotan) y muerte del jefe en cámara lenta con destello.
- Sonidos nuevos para todo lo anterior.

## Novedades de la V3
- **Objetivo por torre:** primero (el más adelantado en el camino), más fuerte o más cercano. Por defecto atacan al primero.
- **Resistencias:** ogros (30 %) y jefes (20 %) resisten las flechas; el hechicero y la catapulta las ignoran. Los espectros resisten flechas y asedio.
- **Oleadas deterministas** con vista previa de su composición en el botón de iniciar.
- **Puntería:** las flechas y hechizos siguen al enemigo; la catapulta apunta a donde estará.
- Monedas flotantes al derrotar enemigos y contador de bajas al terminar.

## Rendimiento
- **Modelos GLB simplificados** (goblin ~5 k, ogro ~7 k, castillo ~26 k triángulos; antes 20–125 k cada uno). Los assets pasaron de ~8 MB a ~1 MB y la escena de ~2 M a ~0,27 M triángulos por fotograma.
- **Escenario estático fusionado** (`mergeStatic`): suelo, camino, árboles y rocas se dibujan en pocas mallas en vez de ~150.
- **Casillas de construcción instanciadas**: 161 anillos en una sola llamada de dibujo.
- **Resolución adaptativa:** si los fps caen de ~40 durante unos segundos, baja sola la resolución de render (mín. 0,6×).
- **Móvil / táctil:** sombras de 1024 px y resolución máxima 1,5×.
- Partículas reutilizadas (pool), barras de vida y anillos liberados al morir/vender, render a ~30 fps en pausa y menú, y la tipografía ya no bloquea la carga.

## Estructura
- `js/config.js` — balance, mapa, torres, enemigos, habilidades, especializaciones, jefes y dificultad.
- `js/state.js` — estado de la partida (`GameState`) y `canAct()`.
- `js/audio.js` — efectos de sonido sintetizados con WebAudio.
- `js/ui.js` — HUD, paneles, menús y eventos del DOM.
- `js/engine3d.js` — mundo 3D, modelos, torres, enemigos y bucle.
- `js/fx.js` — efectos de combate (números de daño, explosiones, rayos, estados, muertes).
- `js/bosses.js` — lógica de las fases de los jefes (escudo, furia, pisotón, invocaciones).
- `js/settings.js` — V5.0: configuración, pantalla completa, vibración y suspensión.
- `js/music.js` — V5.0: música procedural por ambientes.
- `js/save.js` — V5.0: guardado automático y «Continuar».
- `js/ambience.js` — V5.0: cielo, luz por oleada, partículas y braseros.
- `js/progress.js` — V4.1: estrellas, logros, coronas y mejoras permanentes (guardado local).
- `js/skills.js` — habilidades activas, especializaciones de torre y torres aturdidas.
- `js/vendor/` — `three.min.js` y `GLTFLoader.js` (r128, licencia MIT).
- `assets/models/` — modelos GLB (arquero, hechicero, catapulta, goblin, orco guerrero, orco/jefe, castillo).

El mapa conserva las coordenadas 2D (x→X, y→Z) para que el balance sea sencillo de ajustar.


## V5.0
- 4 mapas con progresión y dificultad creciente.
- Panel de estadísticas persistentes y métricas de partida.
- Pantalla de resultados ampliada con bajas, daño, oro y oleadas.
- Manifest + Service Worker para instalación y caché offline cuando se sirve por HTTP/HTTPS.
- El paquete de distribución no incluye `.git/`.

## V6.0 — Dirección de arte
- HUD y paneles con acabado cinematográfico.
- Capa de atmósfera dinámica por mapa y oleada.
- Presentación visual de cada oleada y alerta especial de jefes.
- Minimap táctico en escritorio.
- Partículas ambientales y niebla ligera.
- Iluminación/fog dinámicos según mapa y progreso.
- Mantiene los sistemas V5: mapas, reino, logros, mejoras, especializaciones, habilidades, jefes por fases, guardado y PWA.

## V6.5 — Dirección de arte avanzada
- Clima visual por mapa (lluvia, ascuas, luciérnagas/partículas).
- Ciclo ambiental progresivo de día, ocaso y noche.
- Luna y capas de luz atmosférica.
- Banderas animadas junto al castillo.
- Animaciones secundarias de torres y enemigos.
- Aura pulsante para jefes.
- Presentación cinematográfica de aparición de jefes.
- Compatible con `prefers-reduced-motion` y modo de bajo consumo.

## V6.9.1 — Correcciones
- **Fuga de memoria en las animaciones (`v69.js`)**: los controladores de enemigos muertos y torres vendidas nunca se liberaban (crecían ~15 por oleada) y los mezcladores se borraban con la clave equivocada.
- **Animaciones de enemigos que no se activaban**: el motor llamaba a `V69Animations.trigger/state` sobre el grupo externo, que no tenía el controlador. Ahora se enlaza en `enemyModel`.
- **Deriva de posición/rotación**: el movimiento de reserva sumaba un pequeño desplazamiento en cada fotograma; ahora usa desplazamientos absolutos sin acumulación.
- **Luz y niebla en conflicto (`v6.js` vs `ambience.js`)**: ambas escribían en la misma luz/niebla cada fotograma. El fondo y la niebla tenían colores distintos y la niebla empezaba en 700 con la cámara a ~740, velando casi todo el mapa (muy visible en vertical). Ahora solo `ambience.js` controla luz y niebla, y se añadieron paletas propias para **Bosque Maldito** y **Fortaleza del Eclipse** (antes usaban la del Valle).
- **Espectros sin vuelo**: `v65.js` pisaba su altura de flotación; ahora la conserva.
- **Clima y partículas dependientes de los fps**: la lluvia caía más rápido en pantallas de 120/144 Hz. Ahora van por tiempo.
- **Minimapa**: marcador del castillo bien centrado (775, 150) y oculto en pantallas de poca altura (móvil horizontal), donde tapaba el castillo.
- **Estadísticas**: ganar, seguir en modo sin fin y perder sumaba dos veces el daño y el oro.
- **Service worker**: ya no guarda en caché respuestas de error ni devuelve `index.html` en lugar de un script/modelo que falla; caché `v6.9.1`. Manifest con `sizes: "any"` para el icono SVG.


## V6.9.1 — integración de personajes animados

- `assets/models/zombie.glb`: pack de 10 zombis animados (clip `Take 001`). Cada instancia conserva una sola variante (ver V6.9.4).
- `assets/models/wyvern.glb`: wyvern animado (clips `idol`, `walk`, `flying`, `take off`, `flaping`). Es el modelo del jefe **Wyvern Ancestral** (usa `flaping`).
- `assets/models/solani.glb`: jefe Solani animado con el clip real `Idle`. Los estados de ataque, impacto, fase y muerte mantienen el fallback procedural porque este asset solo incluye `Idle`.
- El resto de personajes conserva los modelos originales y el sistema de fallback de V6.9.
- Los archivos FBX suministrados se mantienen fuera del runtime: son clips fuente y no se fuerzan sobre un rig incompatible.
- Los FBX fuente no forman parte del build de producción: el runtime usa GLTFLoader y no los carga.


## V6.9.2 — Arquero y hechicero animados

Los modelos de las torres de **arqueros** y **hechicero** (`assets/models/archer.glb` y `wizard.glb`) se sustituyeron por el maniquí Mixamo de los FBX suministrados, con animaciones reales:

| Torre | Reposo (bucle) | Ataque (una pasada) |
|---|---|---|
| Arquero | `Standing Aim Idle 02 Looking` | `Standing Draw Arrow` |
| Hechicero | `Standing Idle 03` | `Standing 2H Magic Attack 01` |

- **Conversión**: FBX → GLB con FBX2glTF; los dos clips de cada personaje se fusionaron en un solo GLB (clips `Idle` y `Attack`; mismo rig Mixamo). Malla reducida de ~49 k a ~5 k triángulos (peso ~0,3–0,4 MB cada uno) para mantener el rendimiento.
- **Aspecto**: el maniquí original es gris, así que se pintó por vértice según el hueso dominante (túnica, botas, cinturón, piel). El hechicero lleva sombrero puntiagudo y barba; el arquero, gorro con pluma, aljaba con flechas y un arco en la mano izquierda (todo va unido a los huesos y se mueve con la animación).
- **Animación en el juego (`js/v69.js`)**: el ataque se acelera para caber entre dos disparos (respeta mejoras, Furia Real y velocidad ×2) y al terminar vuelve solo al reposo. Cada torre empieza el reposo en un punto distinto del clip para que no se muevan sincronizadas.
- **Clonado de esqueletos (`js/engine3d.js`)**: `cloneModel()` da a cada copia su propio `Skeleton`; `Object3D.clone()` en three r128 comparte el esqueleto del original entre copias.
- **Service worker**: caché `v6.9.2` para que los navegadores descarguen los modelos nuevos.
- Los modelos 3D se cargan desde `assets/models/`; los jefes pesados se cargan en segundo plano para no bloquear el arranque.

## V6.9.4 — Jefe dragón y Zombi Bruto

- **Jefe «Wyvern Ancestral»** (`BOSS_DEFS` en `js/config.js`): es el primer jefe de la rotación (oleada 5, luego 20…). Vuela a media altura, usa el clip `flaping` (aleteo en sitio, bucle limpio) y tiene 3 fases: CRÍAS (refuerzos), FURIA DRACÓNICA (enfurece + pisotón) y ESCAMAS ARCANAS (escudo). Los jefes pueden llevar `model: [clave, escala]`, `fly` y `hb` (altura de la barra de vida).
- **Zombis**: Ariete, Plaga y Chamán vuelven a usar `zombie.glb` (tamaños ×15, ×11 y ×14; la Plaga conserva el tinte amarillo y el Chamán el verde).
- **Zombi Bruto** (nuevo, estilo ogro): zombi enorme (×27 ≈ 43 de alto), lento (38), vida `110 + 16·oleada`, resistencia 25 % a flechas, recompensa 14. Aparece desde la oleada 4 (~12 % de cada oleada, en lugar de zombis normales) y se cuenta como «blindado» en el aviso de oleada.
- **Una variante por zombi** (`js/engine3d.js`): `zombie.glb` es una multitud de 10 zombis en el suelo más una línea de suelo. `pickZombie()` conserva solo una variante (con su accesorio) por instancia, la centra en el origen y descarta el resto; en `js/v69.js` se filtran las pistas de animación de los esqueletos eliminados.
- **Animaciones reales activas**: `MODELS` era un `const` global y no colgaba de `window`, así que `v69.js` nunca encontraba los clips y todo usaba el movimiento procedural. Ahora `window.MODELS=MODELS`; arqueros, hechiceros, zombis y jefes reproducen sus clips reales.
- **Clonado de esqueletos**: `cloneModel()` enlaza los huesos por posición y no por nombre (en el zombi `_rootJoint` se repite 10 veces).
- **Solani**: escala corregida a `13.3` (antes `0.065`, ~0,4 de alto).
- **Brillo propio**: el destello de daño/hielo/fuego suma sobre el emisivo base del material (`js/fx.js`).
- **Service worker**: caché `v6.9.4`.

## V7.0 — Solo personajes y UI renovada

- **Sin torres**: arqueros y hechicero se colocan como personaje solo, de pie en el suelo y con una sombra suave. Ya no flotan ni se balancean: manda la animación real. La catapulta conserva su modelo. Los puntos de disparo (`top`) bajaron para que proyectiles y rayos salgan de la mano del personaje.
- **Adiós al amarillo al colocar**: casillas en cian claro (anillos finos), vista previa en menta (válido) o rojo (inválido), anillo de selección y de alcance en cian, niveles en blanco azulado y avisos en cristal oscuro.
- **UI/UX**: barra inferior y panel de unidad en cristal, tarjetas de unidad con precio en píldora, selección con borde cian e indicador inferior, botón de oleada verde menta, iconos 🏹 🔮 ⚒. Todo en el bloque `V7` al final de `css/styles.css`.
- Caché del service worker: `v7.0-assets`.

## V7.4 — Avisos y ogros
- **Letrero gigante**: con "reducir movimiento" activo (muy común en móvil/Windows), los avisos de oleada, jefe y presentación quedaban con `opacity:1` para siempre. Ahora se ocultan solos por JS (`v6.js`, `v65.js`) y se rediseñaron como píldoras pequeñas arriba, sin texto secundario y sin capturar toques.
- **Ogro Bruto**: antes era un zombi escalado ×27 (según la variante parecía un zombi flaco); ahora usa el modelo `ogre.glb` (×54) con tinte verdoso. Mismos stats.

## V7.7 — Correcciones
- **El juego no cargaba** (se quedaba en «PREPARANDO EL CAMPO…»): el generador aleatorio de `texturedMat()` (V7.6) devolvía valores negativos y `canvas.arc()` lanzaba una excepción por radio negativo. Ahora usa un LCG correcto en [0, 1).
- **Texturas del suelo y del camino**: `mergeStatic()` fusionaba las mallas sin coordenadas UV, así que la textura se perdía; los materiales con textura ya no se fusionan.
- Avisos de Three.js: se quitó `roughness` (no existe en `MeshLambertMaterial`) y `colorSpace` (r128 usa `encoding`).


## V7.9 — Medieval Village MegaKit
- Se integró un subconjunto optimizado de assets 3D para decoración del mapa: casas modulares, vallas, carro, cajas y enredaderas.
- Los modelos y texturas del pack se cargan de forma diferida después del primer frame para no bloquear el inicio.
- Texturas del kit limitadas a 1024 px máximo para reducir memoria GPU/red.
- La decoración evita la ruta principal y la zona del castillo; no modifica lógica de combate ni construcción.


V8.3: árboles del Stylized Nature MegaKit integrados con carga diferida, 5 variantes 3D y texturas optimizadas para web.

## V8.4 — Mapa más claro
- Árboles: material corregido (hojas visibles y verdes, pinos más claros).
- Valle del Alba: pasto y fondo más claros.
- Se quitó el «Mapa táctico» (repetía el mapa y tapaba el castillo).
- Panel REINO: la sección de mapas ahora se llama «Elegir mapa» y explica cómo se desbloquean.

## V8.5 — Pausa en el celular
- La pantalla de PAUSA ahora se puede tocar para continuar y tiene un botón grande «▶ CONTINUAR» (antes solo reanudaba el botón pequeño de arriba o la tecla P, que no existe en el celular).
