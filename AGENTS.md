# AGENTS.md — Capture (Catcher)

Guía de contexto para la IA al trabajar en este proyecto. Léelo para ubicarte sin recorrer todo el código. La IA trabaja en **español** con el usuario y completa resúmenes de tareas con tablas cuando se le pide.

---

## Qué es

Aplicación web **Next.js** para practicar inglés con canciones. Dos secciones accesibles desde un home:

- **Letras (`/lyrics`)**: reproduce canciones MP3 con sus **letras sincronizadas (LRC)** mostradas en vivo. La línea activa se resalta, se eleva al centro y el panel hace scroll automático.
- **Gramática (`/grammar`)**: dos cosas en la misma página, separadas por grupos en la barra lateral.
  - **Ejercicios**: relleno (gap fill) sobre **frases reales extraídas de las letras**, con explicación de por qué la respuesta es correcta.
  - **Lecturas**: historias que el usuario ya conoce, contadas **enteras en simple present o en simple past**, sin ejercicios. El texto se lee con la misma mecánica visual de las letras: solo el bloque que lees queda oscuro.

## Stack

- **Next.js 16.1.1** (App Router, `reactCompiler: true` en `next.config.ts`), **React 19.2.3**, **TypeScript** (estricto).
- **SCSS Modules** (`*.module.scss`); SASS con `next/font` (Geist).
- Alias de importación (tsconfig): `@/* → ./src/*`.
- Tipos de SCSS declarados en `src/types/styles.d.ts` (así no hace falta `@ts-ignore` al importar estilos).

## Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                     # raíz: fuentes Geist, SiteHeader, globals.scss
│   ├── page.tsx                       # HOME: tarjetas de acceso a las 2 secciones
│   ├── componentes/SiteHeader.tsx     # nav compartida (marca + Letras/Gramática)
│   ├── lyrics/
│   │   ├── page.tsx                   # Server Component con metadata
│   │   ├── componentes/LyricsPlayer.tsx        # reproductor (cliente)
│   │   ├── componentes/LyricsPlayerLoader.tsx  # wrapper "use client" con dynamic ssr:false
│   │   └── styles/lyrics.module.scss
│   ├── grammar/
│   │   ├── page.tsx                   # Server Component: pasa topics, songs y readings al cliente
│   │   ├── componentes/GrammarView.tsx # barra lateral en dos grupos + stage dual
│   │   ├── componentes/Reader.tsx     # lector de historias con audio opcional (cliente)
│   │   └── styles/
│   │       ├── grammar.module.scss
│   │       └── reader.module.scss
│   └── styles/
│       ├── tokens.scss                # variables CSS (:root)
│       ├── globals.scss               # reset + base
│       ├── shell.module.scss          # header
│       └── home.module.scss           # tarjetas del home
├── lib/
│   └── reading-blocks.mjs             # ÚNICA fuente de la agrupación en bloques (+ .d.mts)
├── data/
│   ├── songs.json                     # catálogo de canciones
│   ├── grammar.json                   # temas y ejercicios de gramática
│   ├── readings.json                  # lecturas de historias (sin ejercicios)
│   └── types.ts                       # Song, GrammarTopic, GapFillExercise, Reading, ReadingTimings
├── types/styles.d.ts
public/audio/*.mp3                     # narración de las lecturas (opcional por lectura)
public/data/*.timings.json             # un tiempo de inicio por bloque, junto a los .lrc
```

`public/data/*.lrc` (letras) → `src/data/songs.json` (catálogo) → `LyricsPlayer` (fetch + parseo). `src/data/grammar.json` se **importa de forma estática** (no hay fetch: son datos pequeños y tipados). No hay backend; todo es contenido estático en `public/`.

## Decisiones de diseño ya tomadas (NO revertir)

- **Home como hub**: `/` es el hub con dos tarjetas; las secciones viven en `/lyrics` y `/grammar`. No volver a meter el reproductor en el home.
- **`ssr: false` solo puede vivir en un Client Component**: por eso existe `LyricsPlayerLoader.tsx`; `lyrics/page.tsx` es un Server Component y solo renderiza el loader.
- **Letras en formato LRC** en `public/data/*.lrc`, un archivo por canción con formato `[mm:ss.mmm] texto`. Se fetchean como texto plano y se parsean con `parseLRC` (regex `\[mm:ss(.mmm)?\]`, agnóstico a la cantidad de dígitos del `mmm`).
- **Catálogo en `src/data/songs.json`**: cada entrada es `{ id, title, audio, lrc }`. El `id` es **estable y en minúsculas** y es la clave que usa `grammar.json` para vincular un ejercicio con su canción. Los títulos van capitalizados; las rutas de archivo no se tocan al renombrar.
- **Sincronización por offset**: `LyricsPlayer` usa `OFFSET = -0.2` para adelantar/atrasar el resaltado respecto al tiempo del audio.
- **Resaltado por proximidad**: tres estados por distancia a la línea activa (`active` / `near` / `far`) con transición de opacidad y `translateY`; la línea activa hace `scrollIntoView` suave al centro.
- **Cambio de canción desde el handler, no desde un effect**: `selectSong()` hace el reset (`setCurrentTime(0)`, `currentTime = 0`, `lastScrollIndex`) para no llamar setState dentro de un effect (regla `react-hooks/set-state-in-effect`).
- **Las lecturas viven en `/grammar`, no en una ruta nueva**: la barra lateral tiene dos grupos ("Ejercicios" y "Lecturas") y el stage cambia entre la tarjeta del ejercicio y el `Reader`. No crear `/stories` ni pestañas.
- **`readings.json` está separado de `grammar.json`** porque una lectura no lleva `exercises`. No meter `exercises: []` dentro de los temas para simular una lectura.
- **El lector invierte quién hace scroll respecto a las letras**: en `LyricsPlayer` el `timeupdate` del audio marca la línea activa y la app hace `scrollIntoView`; en `Reader` sin audio es al revés, un listener de `scroll` del panel calcula el bloque activo y **el usuario desplaza**.
- **Con audio, el `Reader` vuelve a ser como las letras**: el `timeupdate` marca el bloque activo y el panel hace `scrollIntoView` suave. El modo por defecto de la v1 es **manual**; el auto-scroll solo se activa si la lectura tiene `audio` + `timings` y el usuario pulsa *Escuchar* (que enciende `follow`). No quitar el modo manual.
- **`composes:` de CSS Modules NO funciona con Turbopack** en este proyecto: las variantes se construyen con **mixins de SCSS** (`@mixin` + `@include`) y la clase base se aplica siempre en el TSX (`${styles.link} ${styles.activeLink}`).

## Narración de lecturas: reglas

- El audio es **opcional por lectura**. `Reading` acepta `audio?` y `timings?`; si faltan, el `Reader` se comporta como lector manual y no renderiza la barra de controles. Nunca dejar `audio` sin `timings` ni al revés (el validador lo falla).
- La agrupación en bloques vive **solo** en `src/lib/reading-blocks.mjs` (+ `reading-blocks.d.mts` para los tipos). La consumen `Reader.tsx`, `scripts/check-readings.mjs` y `scripts/generate-narration.mjs`. Si se cambia `TARGET_BLOCK_CHARS` hay que **regenerar el audio**: los `starts` dependen del bloque.
- Se narra **bloque por bloque** con `say`, nunca el texto entero, porque los tiempos se calculan por bloque. Cada bloque va seguido de una pausa de `0.45s`, y esa pausa forma parte de los `starts`.
- Generar o regenerar:
  ```bash
  npm run narrate                                  # todas las lecturas
  npm run narrate -- --only dbz-super-saiyan-past  # una sola
  npm run narrate -- --only dbz-super-saiyan-past --print-spoken  # ver qué se manda a say
  npm run narrate -- --wpm 150 --gap 0.6           # otros parámetros
  ```
  Genera `public/audio/<id>.mp3` (mono, 96 kbps) y `public/data/<id>.timings.json`.
- El `.timings.json` es `{ textHash, voice, wordsPerMinute, gapSeconds, blocks, starts, duration }`. `starts[i]` es el segundo en que empieza el bloque `i` y siempre empieza en `0` y crece.
- `textHash` es el SHA-256 del `text` recortado a 12 caracteres. Si se edita el texto de una lectura que ya tiene audio, **`npm run check:readings` falla** diciendo que se regenere. Es la red de seguridad para que el audio no se quede desfasado.
- El generador **falla si el desfase entre la duración esperada y la real del MP3 supera `0.25s`**: si aparece, los `starts` no son de fiar.
- Los nombres propios van **respellados en un diccionario** dentro de `generate-narration.mjs` (`PRONOUNCIATIONS`), no se tocan en `readings.json` (el texto se sigue leyendo bien). El diccionario se aplica con límites de palabra, así que `Super Saiyan` se reemplaza antes que `Saiyan`. Al añadir nombres nuevos, respellar y **escuchar el MP3**: no se puede verificar la pronunciación leyendo el código.
- Controles de la v1, ya decididos: `Escuchar/Pausa`, `Seguir` (activo por defecto, se apaga solo al arrastrar el texto mientras suena), `Solo audio` (atenúa el texto a `0.05` sin quitarlo del layout) y `Repetir bloque`. **No añadir control de velocidad ni repetición por frase**: la velocidad va fija en el audio generado (`-r 165`).
- Resaltado **por bloque, no por palabra**: trocear palabras para resaltarlas rompe la prosodia de `say`, así que no se hace.
- `say` solo existe en macOS. En otro sistema operativo, regenerar el audio allí o dejar la lectura sin `audio` (sigue funcionando en manual).

## Ejercicios de gramática: reglas para añadir contenido

- Cada ejercicio tiene `line` con un hueco `___` y `answer` + 3 distractores en `options`.
- **`line` + `answer` reconstruye la letra tal cual aparece en el `.lrc`.** Antes de añadir un ejercicio, comprobar que la frase existe en el archivo:
  ```bash
  node -e "const fs=require('fs'),d=require('./src/data/grammar.json'),s=require('./src/data/songs.json');
  const n=x=>x.replace(/\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  for(const t of d.topics) for(const e of t.exercises){const f=n(e.line.replace('___',e.answer));
  if(!t.songIds.some(id=>n(fs.readFileSync('public'+s.find(x=>x.id===id).lrc,'utf8')).includes(f)))
  console.log('NO ENCONTRADO',t.id,e.id,f);}"
  ```
- Si el hueco es una contracción (`It's`, `I've`, `You'd`), el `line` debe incluir el texto **completo** alrededor del hueco, no el sujeto por separado (`___ got a feeling...` y no `I ___ got a feeling...`).
- Las opciones deben incluir siempre el `answer` y no tener duplicados.
- `songIds` del tema debe incluir la canción de la que sale cada ejercicio.

## Lecturas: reglas para añadir contenido

- Cada lectura es `{ id, title, series, tense: "present" | "past", level, text, vocabulary }`.
- **Una lectura = una historia en UN solo tiempo.** Nunca se mezclan. La versión en **pasado** narra el arco; la versión en **presente** describe quién es el personaje y qué siempre hace. La misma serie se escribe en las dos versiones para poder comparar.
- **Retelling original**: se cuentan los hechos con palabras nuevas. No copiar diálogo ni texto de las fuentes.
- `text` usa `\n\n` entre párrafos (3 o más). El `Reader` agrupa oraciones en bloques de ~220 caracteres; no hace falta hardcodear los bloques.
- `vocabulary` es la jerga de la historia (ki, Saiyan, Shinsengumi, rurouni...) con su traducción en español, 5-8 términos. Va en una lista **al final**, no como markup dentro del texto, porque el parser de bloques trabaja con texto plano.
- **Antes de dar por buena una lectura, correr el validador**:
  ```bash
  npm run check:readings
  ```
  Marca como **fallo** la contaminación grave (`is/are` en una lectura de pasado, `do/does`, `today/now`, sujeto + infinitivo) y como **aviso** la forma dudosa (pasado perfecto, `has/have`, adverbios de hábito, formas en pasado dentro de una lectura en presente). Los avisos hay que revisarlos a mano: la heurística da falsos positivos.
- Añadir candidatos nuevos a `docs/lecturas.md` con `[ ]` para que el usuario los marque.

## Estilos / tema

- **Tokens en `src/app/styles/tokens.scss`** (`:root`): `--bg`, `--surface`, `--surface-alt`, `--text`, `--text-muted`, `--border`, `--radius-*`, `--shadow-*`, `--transition`, `--font-ui`, `--font-display`, `--shell-max`. No escribir colores sueltos en los componentes.
- Fuentes: **Geist / Geist Mono** vía `next/font/google` (variables `--font-geist-sans` / `--font-geist-mono`). La **UI** usa `var(--font-ui)` (Geist); las **letras** conservan la pila `var(--font-display)` (Arial/Helvetica) con `font-weight: 900`.
- Letra activa: `color: var(--text)`, opacidad `1`, `translateY(0)`; cercana opacidad `0.2`; lejana `0.1`.
- Panel de letras: `height: clamp(340px, 55vh, 560px)`, `mask-image` con degradado para desvanecer los bordes, ancho `min(100%, 720px)`.
- **El lector reutiliza los mismos tres estados de opacidad que las letras** (`1` / `0.2` / `0.1`) para que el efecto se sienta igual, pero con tipografía de lectura: peso `500`, `line-height 1.65`, `max-width 62ch`, alineado a la izquierda, `letter-spacing 0`. No copiar el `font-weight: 900` de las letras, que es para cantar.
- Responsive siempre con `clamp()` o `min()`, nunca tamaños fijos para texto o contenedores.
- `globals.scss` tiene `:focus-visible` y un bloque `prefers-reduced-motion`: no borrarlos.

## Contenido pendiente / decisiones abiertas

- `valle de las sombras` tiene la letra **en español**: sirve como práctica de escucha, **no** como fuente de ejercicios de gramática.
- Los ejercicios de gramática no se persisten: el progreso (`solved`) vive en estado de sesión. Si se quiere SRS o progreso entre recargas, usar `localStorage` en `GrammarView`.
- No hay deep-link a una canción concreta desde un ejercicio: `/grammar` enlaza a `/lyrics` sin seleccionar canción.

## Comandos

- Dev: `npm run dev` (usa `--turbo`)
- Build: `npm run build`
- Lint: `npm run lint` (eslint 9)
- Typecheck: `npx tsc --noEmit`
- **Si el SCSS "rompe" por caché después de refactorizar estilos**: `rm -rf .next` y reiniciar el dev server. Los tipos de `.next/types/validator.ts` también se regeneran.
- Verificación típica tras un cambio: `npx tsc --noEmit` + `npm run lint` + `npm run build` + comprobar las rutas afectadas con `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/<ruta>`.

## Reglas de trabajo

- Usar herramientas de archivo (Read/Edit/Write/Glob/Grep) en lugar de comandos de shell para operar sobre archivos.
- No hacer `commit`/`push` salvo que el usuario lo pida explícitamente.
- Mantener tipado estricto; no introducir comentarios a menos que se pidan.
