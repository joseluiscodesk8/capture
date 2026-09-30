# AGENTS.md — Capture (Catcher)

Guía de contexto para la IA al trabajar en este proyecto. Léelo para ubicarte sin recorrer todo el código. La IA trabaja en **español** con el usuario y completa resúmenes de tareas con tablas cuando se le pide.

---

## Qué es

Aplicación web **Next.js** para practicar inglés con canciones. Tres secciones accesibles desde el nav superior y desde el home:

- **Letras (`/lyrics`)**: reproduce canciones MP3 con sus **letras sincronizadas (LRC)** mostradas en vivo. La línea activa se resalta, se eleva al centro y el panel hace scroll automático.
- **Gramática (`/grammar`)**: dos cosas en la misma página, separadas por secciones plegables en la barra lateral.
  - **Ejercicios**: relleno (gap fill) sobre **frases reales extraídas de las letras**, con explicación de por qué la respuesta es correcta.
  - **Lecturas**: historias que el usuario ya conoce, contadas **enteras en simple present o en simple past**, sin ejercicios. El texto se lee con la misma mecánica visual de las letras: solo el bloque que lees queda oscuro. En la barra solo está el nombre de la serie; los títulos de lectura se eligen en la tarjeta de la derecha.
- **Verbos (`/verbs`)**: tabla de los verbos del catálogo con sus tres formas y una frase real de las lecturas, con buscador y filtros.
- **Presente y pasado (`/tenses`)**: la familia completa de tiempos, los cuatro presentes y los cuatro pasados, en acordeones plegables. Cada tiempo abre con explicación detallada: cuándo se usa, cómo se forma (afirmativo/negativo/pregunta), palabras que lo acompañan, ejemplos y fallos típicos. Es contenido **estático** en `src/data/tenses.ts` — no depende de ningún fetch ni de `verbs.json` (el usuario rechazó las frases reales de las lecturas aquí).

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
│   ├── componentes/SiteHeader.tsx     # nav compartida (marca + Letras/Gramática/Verbos/Presente y pasado)
│   ├── componentes/HighlightedSentence.tsx # pinta una frase real con el verbo en color (lo usa /verbs)
│   ├── lyrics/
│   │   ├── page.tsx                   # Server Component con metadata
│   │   ├── componentes/LyricsPlayer.tsx        # reproductor (cliente)
│   │   ├── componentes/LyricsPlayerLoader.tsx  # wrapper "use client" con dynamic ssr:false
│   │   └── styles/lyrics.module.scss
│   ├── grammar/
│   │   ├── page.tsx                   # Server Component: pasa topics, songs y readings al cliente
│   │   ├── componentes/GrammarView.tsx # sidebar con 2 secciones plegables + stage (ejercicio | serie | lectura)
│   │   ├── componentes/Reader.tsx     # lector de historias con audio opcional (cliente)
│   │   └── styles/
│   │       ├── grammar.module.scss
│   │       └── reader.module.scss
│   ├── verbs/
│   │   ├── page.tsx                   # tabla de verbos (Server Component, solo metadata)
│   │   ├── componentes/VerbsTable.tsx # buscador + filtros + tabla (cliente, fetch)
│   │   └── styles/verbs.module.scss
│   ├── tenses/
│   │   ├── page.tsx                   # Server Component: títulos + acordeón (SSR completo)
│   │   ├── componentes/TenseAccordion.tsx # acordeón de un tiempo abierto a la vez (cliente)
│   │   └── styles/tenses.module.scss
│   └── styles/
│       ├── tokens.scss                # variables CSS (:root)
│       ├── globals.scss               # reset + base
│       ├── shell.module.scss          # header
│       ├── highlight.module.scss      # clases de verbo en color para HighlightedSentence
│       └── home.module.scss           # tarjetas del home
├── lib/
│   └── reading-blocks.mjs             # ÚNICA fuente de la agrupación en bloques (+ .d.mts)
├── data/
│   ├── songs.json                     # catálogo de canciones
│   ├── grammar.json                   # temas y ejercicios de gramática
│   ├── readings.json                  # lecturas de historias (sin ejercicios)
│   ├── tenses.ts                      # contenido estático de /tenses: 4 presentes + 4 pasados
│   ├── verb-catalog.json              # lemas + irregulares + doblados, compartido con tag-verbs.mjs
│   └── types.ts                       # Song, GrammarTopic, GapFillExercise, Reading, ReadingTimings, ReadingVerbs, VerbTable
├── types/styles.d.ts
scripts/check-readings.mjs             # validador: tiempo verbal + audio desfasado + verbos desfasados
scripts/generate-narration.mjs          # genera el MP3 + timings de cada lectura con `say`
scripts/tag-verbs.mjs                   # marca los verbos de presente/pasado en <id>.verbs.json + verbs.json
public/audio/*.mp3                     # narración de las lecturas (opcional por lectura)
public/data/*.timings.json             # un tiempo de inicio por bloque, junto a los .lrc
public/data/*.verbs.json               # un tramo por verbo, junto a los .lrc
public/data/verbs.json                 # tabla de verbos con formas y frases de ejemplo
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
- **Las lecturas viven en `/grammar`, no en una ruta nueva**: la barra lateral tiene dos secciones ("Ejercicios" y "Lecturas") y el stage cambia entre la tarjeta del ejercicio, el selector de historias y el `Reader`. No crear `/stories` ni pestañas.
- **La barra lateral va plegada por defecto**: las dos secciones ("Ejercicios", "Lecturas") son acordeones cerrados, así la columna no ocupa media pantalla. Pedido explícito del usuario: *"está toda abierta y se ve incómodo porque consume mucho espacio"*. Ninguna sección debe abrirse sola al montar.
- **En la barra solo aparece el nombre de la serie**; los títulos de lectura **no** van en la barra. Al pulsar una serie, la tarjeta de la derecha lista sus lecturas **cerradas**, y solo se abre la que elijas. Así el usuario decide qué versión (presente/past) quiere ver en vez de que se le imponga la primera. Al cambiar de serie se cierran las lecturas; al volver a pulsar la serie ya abierta se conserva la lectura que tenías.
- El campo `series` de `readings.json` es la clave de agrupación: dos lecturas de la misma historia deben llevar **exactamente el mismo** `series` para quedar juntas en la misma serie.
- **`readings.json` está separado de `grammar.json`** porque una lectura no lleva `exercises`. No meter `exercises: []` dentro de los temas para simular una lectura.
- **El lector invierte quién hace scroll respecto a las letras**: en `LyricsPlayer` el `timeupdate` del audio marca la línea activa y la app hace `scrollIntoView`; en `Reader` sin audio es al revés, un listener de `scroll` del panel calcula el bloque activo y **el usuario desplaza**.
- **Con audio, el `Reader` vuelve a ser como las letras**: el `timeupdate` marca el bloque activo y el panel hace `scrollIntoView` suave. El modo por defecto de la v1 es **manual**; el auto-scroll solo se activa si la lectura tiene `audio` + `timings` y el usuario pulsa *Escuchar* (que enciende `follow`). No quitar el modo manual.
- **`composes:` de CSS Modules NO funciona con Turbopack** en este proyecto: las variantes se construyen con **mixins de SCSS** (`@mixin` + `@include`) y la clase base se aplica siempre en el TSX (`${styles.link} ${styles.activeLink}`).

## Narración de lecturas: reglas

- El audio es **opcional por lectura**. `Reading` acepta `audio?` y `timings?`; si faltan, el `Reader` se comporta como lector manual y no renderiza la barra de controles. Nunca dejar `audio` sin `timings` ni al revés (el validador lo falla).
- La agrupación en bloques vive **solo** en `src/lib/reading-blocks.mjs` (+ `reading-blocks.d.mts` para los tipos). La consumen `Reader.tsx` (`buildBlocks`), `scripts/check-readings.mjs`, `scripts/generate-narration.mjs` y `scripts/tag-verbs.mjs`. Si se cambia `TARGET_BLOCK_CHARS` hay que **regenerar el audio**: los `starts` dependen del bloque. Cada bloque lleva `start`/`end` **absolutos** en el texto; el `text` del bloque lleva los saltos de párrafo normalizados a un espacio, así que `text.slice(start, end)` no es idéntico a `block.text` cuando el bloque fusiona dos párrafos.
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

## Verbos resaltados: reglas

- **Solo dos colores**, decididos por el usuario: simple present y simple past. El resto de formas (modales, infinitivos, `-ing`, participios) **no se marcan** a propósito, para no enseñar que un modal es un tiempo verbal. No añadir más categorías sin preguntar.
- **El resaltado es SOLO color de texto** (`--verb-present`, `--verb-past` en `tokens.scss`). Se empezó con color + subrayado de `3px` y el usuario lo rechazó: *"no me gusta, el subrayado no se ve bien"*. No reintroducir el subrayado ni fondos.
- **`text` sigue siendo texto plano.** El marcado de verbos **nunca** se mete en `readings.json`: viviría en el `text` y rompería a la vez el TTS, el validador de tiempo verbal y el hash del audio. Vive aparte en `public/data/<id>.verbs.json` como `VerbMark { from, to, tense, surface }` con offsets absolutos.
- Generar o regenerar:
  ```bash
  npm run verbs                                   # todas
  npm run verbs -- --only dbz-super-saiyan-past   # una
  npm run verbs -- --report --suspicious           # revisión: qué marca y qué se queda sin marcar
  ```
- **`--report` y `--suspicious` son la revisión obligatoria, no un extra.** `--report` imprime cada oración con los verbos entre corchetes; `--suspicious` lista las palabras con forma verbal que **no** se marcaron. Antes de dar por buena una lectura nueva hay que leer las dos listas: un sustantivo marcado (`fight`, `last`, `cut`) y un verbo sin marcar son ambos fallos.
- El tense de cada verbo se toma **del `tense` de la lectura**, no de la morfología. Es válido porque el validador ya garantiza que una lectura no mezcla tiempos. Por eso el generador solo tiene que decidir *qué palabras son verbos*.
- Reglas del clasificador (`tag-verbs.mjs`), en orden:
  1. Se ignoran los verbos tras `to`, tras un modal, y los que acaban en `-ing`.
  2. El alcance del modal se corta en **coma y en punto**: `can only stop` no marca `stop`, pero `a cut can only stop a fight, never end a life` **sí** marca `end`. Por eso los tokens llevan `sentenceStart` y `clauseBreak`.
  3. Un pasado justo tras `was/were` es participio, no pasado simple: `was left` marca solo `was`.
  4. `do/does/did` + `not` + verbo se marca como **un solo tramo** (`does not know`). Vale tanto para la contracción (`doesn't know`) como para la forma con espacio (`does not know`): la forma con espacio la cubre `SPACED_AUX` + `NEGATORS`, porque `do/does/did` no están en `LEMMAS` y por tanto no salen de `FORM_INDEX`. Sin ese caso se marcaba `not know` y se dejaba `does` sin color.
  5. `not`/`never` se incluyen dentro del tramo del verbo si van pegados.
  6. `SKIP_SURFACES` son formas base que en este corpus son sustantivo o adjetivo: `fight`, `last`, `beat`.
- Cada marca lleva su `lemma` (`VerbMark.lemma`), que es lo que permite construir la tabla de `/verbs` sin volver a adivinar la conjugación. Los auxiliares se atribuyen a `be` y `do`.
- La **generación de formas no es fiable por morfología**: `regularPast("drop")` da `droped`, no `dropped`. El doblado de consonante depende del acento. Por eso `DOUBLE_CONSONANT` es una lista curada, no una regla. Al añadir un verbo con terminación consonante + vocal + consonante (`drop`, `stop`, `plan`) hay que comprobar a mano su pasado.
- `textHash` en el `.verbs.json` es la misma red de seguridad que el del audio: si se edita el texto, `npm run check:readings` falla y hay que correr `npm run verbs` (y `npm run narrate` si la lectura ya tiene audio).
- `buildBlocks(text, verbs)` parte cada bloque en `segments` (`{ text, tense? }`) para poder pintar. `Reader.tsx` pinta un `<mark>` por segmento con `tense`. Los segmentos reconstituyen `block.text` **exactamente**: si se cambia `splitByMarks`, comprobarlo reensamblando, porque un `slice` mal hecho pierde letras en silencio.

## Catálogo de verbos y página `/verbs`

- **El catálogo está en `src/data/verb-catalog.json`** y lo importan tanto `scripts/tag-verbs.mjs` como el resto. Antes vivía duplicado dentro del script, que es exactamente como el marcado y la página acaban discrepando. Contiene `lemmas` (147), `irregularPast`, `doubleConsonant` y `skipSurfaces`. `irregularPast` tiene verbos que **no** son lemas del catálogo: son solo morfología, no filas de la tabla. En general, si un irregular se usa en una lectura, su lema va en `lemmas` (`begin` pasó a serlo porque `began` aparece en `db-07-piccolo-junior-past`).
- **Al ampliar el catálogo hay que comprobar tres cosas, no solo que compile**:
  1. **El pasado de cada lema.** `regularPast` no vale para los irregulares: sin entrada en `irregularPast`, `sell` produce `selld`. Se rompe en silencio.
  2. **Que el lema no choque con un sustantivo en lecturas ya escritas.** En una lectura en **presente** se marcan *todas* las formas, así que añadir `own` pintaba "his **own** master" de Samurai X como verbo. `own` salió del catálogo. Lo mismo con `cut`: su base y su pasado son la misma palabra, así que no se puede añadir sin marcar "a **cut** could never kill" como verbo.
  3. **Que no mueva los conteos de las lecturas anteriores.** Tras ampliar el catálogo, `npm run verbs` debe dejar `dbz-super-saiyan-past` en 44, `dbz-super-saiyan-present` en 52, `samurai-x-oath-past` en 38 y `samurai-x-oath-present` en 48. Si alguno sube, un lema nuevo ha marcado algo que no es verbo.
- `--suspicious` **solo lista verbos que deberían estar marcados y no lo están**: exige que la forma valga para el tiempo de la lectura, que no sea infinitivo/participio (regla 1) ni participio tras `was/were` (regla 3). Antes listaba cualquier palabra con aspecto verbal presente en `FORM_INDEX`, y por eso llenaba de falsos positivos (`fights`, `faces`, `bring` tras `to`) mientras dejaba pasar el fallo real: `talk` no estaba en el catálogo y "did not talk" se quedaba sin color sin salir en ninguna lista. La revisión manual sigue siendo obligatoria, pero ahora lo que sale es accionable.
- `npm run verbs` genera **dos cosas**: `public/data/<id>.verbs.json` (una por lectura) y `public/data/verbs.json` (la tabla de la página). Con `--only` **no** se regenera `verbs.json`, porque sus ejemplos salen de todas las lecturas; el script lo avisa.
- Cada fila de `verbs.json` es `{ lemma, thirdPerson, past, irregular, tenses, examples }`. `examples` trae como máximo **uno por tiempo**, con la frase real y los offsets del verbo **dentro de la frase** (`from`/`to` relativos a `sentence`, no al texto entero). Ese detalle es fácil de equivocar: la página los usa tal cual para pintar.
- El render de una frase real con el verbo en color es **un único componente compartido** (`HighlightedSentence`), que hoy solo usa `/verbs`. Antes cada página llevaba su propia copia de los mismos párrafos; si se tocan los estilos, tocar solo `highlight.module.scss`. Traduce una frase del texto recortando por sus offsets; no reensamblar a mano.
- El contenido de `/tenses` (los 8 tiempos) está **estático y tipado** en `src/data/tenses.ts`, sin fetch ni dependencia de `verbs.json`. El acordeón (`TenseAccordion`) deja **un solo tiempo abierto a la vez**, como la barra de `/grammar`, y cerrarlo por defecto es lo que prefiere el usuario.
- La página `/verbs` (ruta propia, enlace en el `SiteHeader` junto a Letras y Gramática) es una tabla con **base / 3ª persona / pasado / frase real**, más buscador y filtros por tiempo e historia. La Highlight del ejemplo va en el color del tiempo, igual que en el `Reader`, para que el usuario asocie las dos vistas.
- Un verbo **sin frase** se muestra igual, con *"sin frase en las lecturas todavía"*. No inventar frases: el valor de la columna es que sean frases reales. Los 5 sin ejemplo ahora mismo (`arrive`, `beat`, `build`, `do`, `follow`) están justificados: tres solo aparecen como infinitivo tras `to`, uno está en `skipSurfaces`, uno no aparece y `do` solo es auxiliar de `does not know`.

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

- Cada lectura es `{ id, title, series, tense: "present" | "past", text, vocabulary }`, más `verbs` (ruta al JS de verbos), y `audio`/`timings` opcionales cuando hay narración.
- **No hay niveles en las lecturas.** El usuario descartó tanto los niveles conmutables (A1/A2/B2) como la etiqueta descriptiva: se eliminó el campo `level` de `readings.json`, de los tipos, del validador y de la UI. Los temas de gramática de `src/data/grammar.json` conservan los suyos, y ese archivo no se toca.
- **Una lectura = una historia en UN solo tiempo.** Nunca se mezclan.
- **Cada historia va en un solo tiempo, y no hace falta la otra versión.** La regla anterior ("la misma serie en presente y pasado") era del principio y el usuario la cambió: *"olvídate mejor de los niveles… que cada historia esté contada en un tiempo pasado o presente, por lo menos"*. Dragon Ball son 7 capítulos **solo en pasado** y el validador lo acepta (avisa como `info`, no como aviso).
- **Un capítulo de saga son ~1000 palabras (8-12 párrafos).** El usuario pidió lecturas de al menos 5 minutos y eligió el objetivo de ~1000 palabras (~8-10 min leyendo, ~6 min en audio). Es un capítulo con presentación, conflicto y desenlace, no una escena. El validador acepta 150-1250 palabras como rango válido.
- **La unidad es el capítulo, no la serie.** Una saga larga se parte en arcos: Dragon Ball son 7 capítulos, y el número va en el propio `title` (`"1 · El viaje con Bulma"`). No hace falta un campo `chapter` porque el orden de lectura ya lo da la posición en el array.
- **`series` es la clave de agrupación y cada saga es un grupo**: `Dragon Ball`, `Dragon Ball Z`, `Samurai X (Rurouni Kenshin)`. El orden de los grupos en la barra lateral es **el orden de aparición en `readings.json`**, por eso Dragon Ball va primero en el array. No reordenar el archivo sin querer.
- **Retelling original**: se cuentan los hechos con palabras nuevas. No copiar diálogo ni texto de las fuentes.
- `text` usa `\n\n` entre párrafos (3 o más). El `Reader` agrupa oraciones en bloques de ~200 caracteres; no hace falta hardcodear los bloques. Ninguna oración puede pasar de `MAX_BLOCK_CHARS` (260) porque el validador la falla como bloque demasiado largo.
- `vocabulary` es la jerga de la historia (Dragon Ball, Roshi, Tenshinhan, rurouni...) con su traducción en español, 5-8 términos. Va en una lista **al final**, no como markup dentro del texto, porque el parser de bloques trabaja con texto plano. El término del glosario no lleva tilde si es inglés (`a legend`, `a tournament`); la traducción sí.
- **Antes de dar por buena una lectura, correr el validador**:
  ```bash
  npm run check:readings
  ```
  Marca como **fallo** la contaminación grave (`is/are` en una lectura de pasado, `do/does`, `today/now`, sujeto + infinitivo) y como **aviso** la forma dudosa (pasado perfecto, `has/have`, adverbios de hábito, formas en pasado dentro de una lectura en presente). Los avisos hay que revisarlos a mano: la heurística da falsos positivos.
  También falla si el **audio o los verbos están desfasados** respecto al texto (hash distinto), si un `starts` no crece, si los verbos se solapan o caen fuera de un bloque, o si un verbo está marcado con un tense que no es el de la lectura.
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
