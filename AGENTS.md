# AGENTS.md — Capture (Catcher)

Guía de contexto para la IA al trabajar en este proyecto. Léelo para ubicarte sin recorrer todo el código. La IA trabaja en **español** con el usuario y completa resúmenes de tareas con tablas cuando se le pide.

---

## Qué es

Aplicación web **Next.js** para practicar inglés con canciones. Dos secciones accesibles desde un home:

- **Letras (`/lyrics`)**: reproduce canciones MP3 con sus **letras sincronizadas (LRC)** mostradas en vivo. La línea activa se resalta, se eleva al centro y el panel hace scroll automático.
- **Gramática (`/grammar`)**: ejercicios de relleno (gap fill) sobre **frases reales extraídas de las letras**, con explicación de por qué la respuesta es correcta.

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
│   │   ├── page.tsx                   # Server Component: pasa topics y songs al cliente
│   │   ├── componentes/GrammarView.tsx
│   │   └── styles/grammar.module.scss
│   └── styles/
│       ├── tokens.scss                # variables CSS (:root)
│       ├── globals.scss               # reset + base
│       ├── shell.module.scss          # header
│       └── home.module.scss           # tarjetas del home
├── data/
│   ├── songs.json                     # catálogo de canciones
│   ├── grammar.json                   # temas y ejercicios de gramática
│   └── types.ts                       # Song, GrammarTopic, GapFillExercise
└── types/styles.d.ts
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
- **`composes:` de CSS Modules NO funciona con Turbopack** en este proyecto: las variantes se construyen con **mixins de SCSS** (`@mixin` + `@include`) y la clase base se aplica siempre en el TSX (`${styles.link} ${styles.activeLink}`).

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

## Estilos / tema

- **Tokens en `src/app/styles/tokens.scss`** (`:root`): `--bg`, `--surface`, `--surface-alt`, `--text`, `--text-muted`, `--border`, `--radius-*`, `--shadow-*`, `--transition`, `--font-ui`, `--font-display`, `--shell-max`. No escribir colores sueltos en los componentes.
- Fuentes: **Geist / Geist Mono** vía `next/font/google` (variables `--font-geist-sans` / `--font-geist-mono`). La **UI** usa `var(--font-ui)` (Geist); las **letras** conservan la pila `var(--font-display)` (Arial/Helvetica) con `font-weight: 900`.
- Letra activa: `color: var(--text)`, opacidad `1`, `translateY(0)`; cercana opacidad `0.2`; lejana `0.1`.
- Panel de letras: `height: clamp(340px, 55vh, 560px)`, `mask-image` con degradado para desvanecer los bordes, ancho `min(100%, 720px)`.
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
