export type TenseFormRow = {
  label: string;
  formula: string;
  example: string;
};

export type TenseUse = {
  text: string;
  example?: string;
};

export type TenseInfo = {
  id: string;
  name: string;
  group: "present" | "past";
  pronunciation?: string;
  intro: string;
  uses: TenseUse[];
  forms: TenseFormRow[];
  markers: string[];
  examples: string[];
  mistakes: string[];
};

export type TenseGroup = {
  key: "present" | "past";
  label: string;
  intro: string;
  items: TenseInfo[];
};

export const TENSE_GROUPS: TenseGroup[] = [
  {
    key: "present" as const,
    label: "Presente",
    intro:
      "Cuatro formas de hablar del presente. El simple present y el present perfect son los más frecuentes; los otros dos añaden la idea de acción en curso.",
    items: [
      {
        id: "simple-present",
        name: "Simple present",
        group: "present",
        intro:
          "El tiempo por defecto para hablar del presente: rutinas, hechos y descripciones. Es el que usan las lecturas de Catcher para decir quién es el personaje y qué hace siempre.",
        uses: [
          {
            text: "Rutinas y hábitos.",
            example: "I train every morning.",
          },
          {
            text: "Verdades generales y hechos.",
            example: "Water boils at one hundred degrees.",
          },
          {
            text: "Descripciones y estados que no cambian en el momento.",
            example: "He lives in Tokyo.",
          },
          {
            text: "Horarios y programas.",
            example: "The train leaves at six.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + verbo base (-s / -es / -ies)",
            example: "He trains · He goes · He tries",
          },
          {
            label: "Negativo",
            formula: "sujeto + do not / does not + verbo",
            example: "He does not know · I do not run",
          },
          {
            label: "Pregunta",
            formula: "Do / Does + sujeto + verbo?",
            example: "Does he train? · Do they live here?",
          },
          {
            label: "To be",
            formula: "am / is / are",
            example: "I am strong · Goku is far away",
          },
        ],
        markers: [
          "always",
          "usually",
          "often",
          "sometimes",
          "never",
          "every day",
          "on Mondays",
        ],
        examples: [
          "He never runs away.",
          "She works in a hospital.",
          "The sun rises in the east.",
        ],
        mistakes: [
          "He don't work.  →  He doesn't work.",
          "She go to the gym.  →  She goes to the gym.",
        ],
      },
      {
        id: "present-continuous",
        name: "Present continuous",
        group: "present",
        pronunciation: "present progressive",
        intro:
          "Una acción en curso, ahora mismo o alrededor de ahora. Se forma con to be + el verbo en -ing.",
        uses: [
          {
            text: "Algo que está pasando en este momento.",
            example: "I am reading right now.",
          },
          {
            text: "Situación temporal alrededor de ahora.",
            example: "She is staying with us this week.",
          },
          {
            text: "Plan fijado para un futuro cercano.",
            example: "We are flying to Madrid tomorrow.",
          },
          {
            text: "Cambios y desarrollo.",
            example: "Prices are going up.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + am / is / are + verbo-ing",
            example: "I am training · He is smiling",
          },
          {
            label: "Negativo",
            formula: "sujeto + am / is / are + not + verbo-ing",
            example: "She is not working",
          },
          {
            label: "Pregunta",
            formula: "Am / Is / Are + sujeto + verbo-ing?",
            example: "Is he training? · Are you listening?",
          },
        ],
        markers: ["now", "right now", "at the moment", "today", "this week", "look!", "listen!"],
        examples: [
          "Look! He is transforming.",
          "Right now I am learning English.",
          "They are building a new bridge.",
        ],
        mistakes: [
          "I am knowing the answer.  →  I know the answer.",
          "She is liking pizza.  →  She likes pizza.",
        ],
      },
      {
        id: "present-perfect",
        name: "Present perfect",
        group: "present",
        intro:
          "Conecta el pasado con el presente: lo que ocurrió y sigue importando ahora. No dice cuándo, solo que ya ha pasado.",
        uses: [
          {
            text: "Experiencias de vida, sin momento concreto.",
            example: "Have you ever flown?",
          },
          {
            text: "Hecho pasado con resultado en el presente.",
            example: "I have lost my keys.",
          },
          {
            text: "Acción que empezó en el pasado y sigue.",
            example: "He has lived here for ten years.",
          },
          {
            text: "Algo acabado hace nada.",
            example: "She has just finished.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + have / has + participio",
            example: "She has finished · They have left",
          },
          {
            label: "Negativo",
            formula: "sujeto + have not / has not + participio",
            example: "He has not seen it",
          },
          {
            label: "Pregunta",
            formula: "Have / Has + sujeto + participio?",
            example: "Has she arrived? · Have you eaten?",
          },
        ],
        markers: ["ever", "never", "already", "yet", "just", "for", "since", "recently", "so far"],
        examples: [
          "I have never flown in a plane.",
          "He has already won three matches.",
          "Goku has known her since childhood.",
        ],
        mistakes: [
          "I have seen him yesterday.  →  I saw him yesterday.",
          "She has lived here since two years.  →  She has lived here for two years.",
        ],
      },
      {
        id: "present-perfect-continuous",
        name: "Present perfect continuous",
        group: "present",
        pronunciation: "present perfect progressive",
        intro:
          "Lo mismo que el present perfect, pero enfatizando la duración de la acción: cuánto tiempo lleva pasando.",
        uses: [
          {
            text: "Duración de una acción que empezó antes y sigue.",
            example: "I have been working here for five years.",
          },
          {
            text: "Actividad reciente con un resultado visible.",
            example: "He is sweating because he has been running.",
          },
          {
            text: "Preguntas con how long.",
            example: "How long have you been waiting?",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + have / has been + verbo-ing",
            example: "She has been waiting",
          },
          {
            label: "Negativo",
            formula: "sujeto + have not / has not been + verbo-ing",
            example: "He has not been sleeping",
          },
          {
            label: "Pregunta",
            formula: "Have / Has + sujeto + been + verbo-ing?",
            example: "Has she been working?",
          },
        ],
        markers: ["for", "since", "all day", "lately", "recently", "how long"],
        examples: [
          "She has been training all day.",
          "I have been reading this book for weeks.",
          "He has been living in Tokyo since 2020.",
        ],
        mistakes: [
          "I have been knowing her for years.  →  I have known her for years.",
          "I have been working here since five years.  →  I have been working here for five years.",
        ],
      },
    ],
  },
  {
    key: "past" as const,
    label: "Pasado",
    intro:
      "Cuatro formas de hablar del pasado. El simple past narra la historia; los demás ordenan acciones o describen el escenario mientras algo pasaba.",
    items: [
      {
        id: "simple-past",
        name: "Simple past",
        group: "past",
        intro:
          "Acciones terminadas en un momento concreto del pasado. Es el tiempo de las narrativas: empieza, se complica y se resuelve. Es el que usa Catcher para contar el arco de la historia.",
        uses: [
          {
            text: "Acción terminada en un momento concreto.",
            example: "He flew to Tokyo yesterday.",
          },
          {
            text: "Secuencia de eventos: y luego… y luego…",
            example: "He fought, he won, and he left.",
          },
          {
            text: "Estados terminados que ya no son verdad.",
            example: "She lived in Tokyo in 2010.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + verbo-ed / forma irregular",
            example: "He walked · He flew",
          },
          {
            label: "Negativo",
            formula: "sujeto + did not + verbo base",
            example: "He did not know",
          },
          {
            label: "Pregunta",
            formula: "Did + sujeto + verbo base?",
            example: "Did he arrive? · Did you see him?",
          },
          {
            label: "To be",
            formula: "was / were",
            example: "He was alone · They were friends",
          },
        ],
        markers: ["yesterday", "last week", "last year", "ago", "in 2010", "then", "after", "finally"],
        examples: [
          "Goku flew through the sky.",
          "The boy tried to fight and won.",
          "She worked in that hospital in 2010.",
        ],
        mistakes: [
          "Did you saw him?  →  Did you see him?",
          "He doesn't went.  →  He didn't go.",
        ],
      },
      {
        id: "past-continuous",
        name: "Past continuous",
        group: "past",
        pronunciation: "past progressive",
        intro:
          "Una acción que estaba en curso en un momento del pasado. Pinta el escenario y describe lo que pasaba mientras otra cosa ocurría.",
        uses: [
          {
            text: "Acción en curso en un momento concreto del pasado.",
            example: "He was sleeping at eight o'clock.",
          },
          {
            text: "Acción interrumpida por otra (when).",
            example: "I was eating when he arrived.",
          },
          {
            text: "Dos acciones a la vez (while).",
            example: "She trained while he slept.",
          },
          {
            text: "Ambiente y escenario de una historia.",
            example: "It was raining that night.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + was / were + verbo-ing",
            example: "He was flying · They were training",
          },
          {
            label: "Negativo",
            formula: "sujeto + was not / were not + verbo-ing",
            example: "He was not listening",
          },
          {
            label: "Pregunta",
            formula: "Was / Were + sujeto + verbo-ing?",
            example: "Was he sleeping?",
          },
        ],
        markers: ["at 8 o'clock", "at that moment", "while", "when", "all morning"],
        examples: [
          "He was flying when the storm began.",
          "They were destroying the city while the boy watched.",
          "I was reading when the phone rang.",
        ],
        mistakes: [
          "It was raining since the morning.  →  It had been raining since the morning.",
          "I was working here since 2010.  →  I worked here since 2010.",
        ],
      },
      {
        id: "past-perfect",
        name: "Past perfect",
        group: "past",
        intro:
          "La acción que ocurrió antes de otra acción pasada. Sirve para ordenar dos momentos en el pasado: primero el past perfect, después el simple past.",
        uses: [
          {
            text: "La acción más antigua de dos pasadas.",
            example: "He had already left when I arrived.",
          },
          {
            text: "La causa de un resultado en el pasado.",
            example: "I was tired because I had trained all day.",
          },
          {
            text: "En narrativa, para dejar claro el orden.",
            example: "By the time she arrived, the fight had ended.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + had + participio",
            example: "He had left · She had seen it",
          },
          {
            label: "Negativo",
            formula: "sujeto + had not + participio",
            example: "He had not finished",
          },
          {
            label: "Pregunta",
            formula: "Had + sujeto + participio?",
            example: "Had you ever fought?",
          },
        ],
        markers: ["already", "before", "by the time", "after", "when", "until"],
        examples: [
          "He had never flown before that day.",
          "She had finished the race before the rain started.",
          "Kenshin had made the promise years earlier.",
        ],
        mistakes: [
          "I had saw it.  →  I had seen it.",
          "He said he didn't saw her.  →  He said he hadn't seen her.",
        ],
      },
      {
        id: "past-perfect-continuous",
        name: "Past perfect continuous",
        group: "past",
        pronunciation: "past perfect progressive",
        intro:
          "La duración de una acción hasta un momento del pasado: cuánto tiempo llevaba pasando cuando ocurrió algo.",
        uses: [
          {
            text: "Duración de una acción hasta otro momento del pasado.",
            example: "She had been waiting for two hours when he arrived.",
          },
          {
            text: "La causa (con duración) de un resultado pasado.",
            example: "He was exhausted because he had been fighting all night.",
          },
        ],
        forms: [
          {
            label: "Afirmativo",
            formula: "sujeto + had been + verbo-ing",
            example: "He had been training",
          },
          {
            label: "Negativo",
            formula: "sujeto + had not been + verbo-ing",
            example: "She had not been sleeping",
          },
          {
            label: "Pregunta",
            formula: "Had + sujeto + been + verbo-ing?",
            example: "Had he been fighting?",
          },
        ],
        markers: ["for", "since", "before", "by the time", "for hours", "all night"],
        examples: [
          "They had been fighting for hours when Goku arrived.",
          "She had been living in the village since 2010.",
          "He had been training for years before he won.",
        ],
        mistakes: [
          "She had been worked.  →  She had been working.",
          "He had been worked there for years.  →  He had worked there for years (sin -ing).",
        ],
      },
    ],
  },
];