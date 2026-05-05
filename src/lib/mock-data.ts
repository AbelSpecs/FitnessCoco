// export type Goal = "muscle" | "fat-loss" | "strength" | "endurance";

import { Goal } from "@/types/goals";
import { User } from "@/types/user";

// export const goalLabels: Record<Goal, string> = {
//   muscle: "Ganar masa muscular",
//   "fat-loss": "Perder grasa",
//   strength: "Ganar fuerza",
//   endurance: "Ganar resistencia",
// };

export const userProfile: User = {
  id: 1,
  name: "Diego Martínez",
  age: 28,
  weight: 78,
  gender: "Masculino",
  goal: "muscle" as Goal,
  streak: 12,
  parqCompleted: false,
  parqValidUntil: "12 mar 2026",
  coachId: 1,
  planType: "basic",
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  restSec: number;
  videoUrl?: string;
  history: { date: string; weight: number; reps: number; rpe: number }[];
  todayLog?: { weight?: number; reps?: number; rpe?: number; notes?: string };
};

export type DayPlan = {
  id: string;
  day: string;
  short: string;
  focus: string;
  durationMin: number;
  exercises: Exercise[];
  rest?: boolean;
};

const hist = (base: number) =>
  Array.from({ length: 8 }, (_, i) => ({
    date: `Sem ${i + 1}`,
    weight: base + i * 2.5 + (i % 2 === 0 ? 0 : 1),
    reps: 8 + (i % 3),
    rpe: 7 + (i % 3) * 0.5,
  }));

export const weekPlan: DayPlan[] = [
  {
    id: "mon",
    day: "Lunes",
    short: "L",
    focus: "Pecho & Tríceps",
    durationMin: 60,
    exercises: [
      {
        id: "bench",
        name: "Press Banca",
        muscle: "Pecho",
        sets: 4,
        reps: "8-10",
        restSec: 120,
        history: hist(60),
      },
      {
        id: "incline-db",
        name: "Press Inclinado Mancuernas",
        muscle: "Pecho superior",
        sets: 3,
        reps: "10-12",
        restSec: 90,
        history: hist(22),
      },
      {
        id: "dips",
        name: "Fondos en paralelas",
        muscle: "Tríceps",
        sets: 3,
        reps: "Al fallo",
        restSec: 90,
        history: hist(0),
      },
      {
        id: "pushdown",
        name: "Extensión polea alta",
        muscle: "Tríceps",
        sets: 3,
        reps: "12-15",
        restSec: 60,
        history: hist(25),
      },
    ],
  },
  {
    id: "tue",
    day: "Martes",
    short: "M",
    focus: "Espalda & Bíceps",
    durationMin: 65,
    exercises: [
      {
        id: "deadlift",
        name: "Peso Muerto",
        muscle: "Espalda baja",
        sets: 4,
        reps: "5-6",
        restSec: 180,
        history: hist(100),
      },
      {
        id: "pullup",
        name: "Dominadas",
        muscle: "Dorsal",
        sets: 4,
        reps: "8-10",
        restSec: 120,
        history: hist(0),
      },
      {
        id: "row",
        name: "Remo con barra",
        muscle: "Espalda media",
        sets: 3,
        reps: "10-12",
        restSec: 90,
        history: hist(40),
      },
      {
        id: "curl",
        name: "Curl Bíceps",
        muscle: "Bíceps",
        sets: 3,
        reps: "12",
        restSec: 60,
        history: hist(15),
      },
    ],
  },
  {
    id: "wed",
    day: "Miércoles",
    short: "X",
    focus: "Descanso activo",
    durationMin: 30,
    rest: true,
    exercises: [],
  },
  {
    id: "thu",
    day: "Jueves",
    short: "J",
    focus: "Pierna & Glúteo",
    durationMin: 70,
    exercises: [
      {
        id: "squat",
        name: "Sentadilla",
        muscle: "Cuádriceps",
        sets: 4,
        reps: "6-8",
        restSec: 180,
        history: hist(80),
      },
      {
        id: "rdl",
        name: "Peso muerto rumano",
        muscle: "Femoral",
        sets: 3,
        reps: "10",
        restSec: 120,
        history: hist(60),
      },
      {
        id: "lunge",
        name: "Zancadas",
        muscle: "Glúteo",
        sets: 3,
        reps: "12 c/lado",
        restSec: 90,
        history: hist(20),
      },
      {
        id: "calf",
        name: "Elevación gemelos",
        muscle: "Gemelo",
        sets: 4,
        reps: "15",
        restSec: 60,
        history: hist(40),
      },
    ],
  },
  {
    id: "fri",
    day: "Viernes",
    short: "V",
    focus: "Hombro & Core",
    durationMin: 55,
    exercises: [
      {
        id: "ohp",
        name: "Press militar",
        muscle: "Hombro",
        sets: 4,
        reps: "8",
        restSec: 120,
        history: hist(40),
      },
      {
        id: "lateral",
        name: "Elevaciones laterales",
        muscle: "Deltoide medio",
        sets: 4,
        reps: "12-15",
        restSec: 60,
        history: hist(8),
      },
      {
        id: "plank",
        name: "Plancha",
        muscle: "Core",
        sets: 3,
        reps: "60s",
        restSec: 45,
        history: hist(0),
      },
    ],
  },
  {
    id: "sat",
    day: "Sábado",
    short: "S",
    focus: "Cardio HIIT",
    durationMin: 40,
    exercises: [
      {
        id: "hiit",
        name: "Sprints 30/30",
        muscle: "Cardio",
        sets: 8,
        reps: "30s",
        restSec: 30,
        history: hist(0),
      },
    ],
  },
  {
    id: "sun",
    day: "Domingo",
    short: "D",
    focus: "Descanso total",
    durationMin: 0,
    rest: true,
    exercises: [],
  },
];

export const volumeData = Array.from({ length: 12 }, (_, i) => ({
  week: `S${i + 1}`,
  volume: 8000 + i * 450 + (i % 3) * 300,
  sessions: 3 + (i % 2),
}));

export const strengthData = [
  { exercise: "Press Banca", current: 80, previous: 72.5 },
  { exercise: "Sentadilla", current: 105, previous: 95 },
  { exercise: "Peso Muerto", current: 130, previous: 120 },
  { exercise: "Press Militar", current: 55, previous: 50 },
  { exercise: "Dominadas", current: 12, previous: 9 },
];

export const parqQuestions = [
  "¿Alguna vez su médico le ha indicado que usted tiene un problema cardiovascular y que solo puede llevar a cabo ejercicios o actividad física referido por un médico?",
  "¿Sufre de dolores frecuentes en el pecho cuando realiza algún tipo de actividad física?",
  "¿En el último mes, le ha dolido el pecho cuando no estaba haciendo actividad física?",
  "¿Con frecuencia pierde el equilibrio debido a mareos, o alguna vez ha perdido el conocimiento?",
  "¿Tiene problemas en los huesos o articulaciones (espalda, rodillas o cadera) que pudieran agravarse al aumentar la actividad física?",
  "¿Al presente, le receta su médico medicamentos (por ejemplo, pastillas de agua) para la presión arterial o problemas con el corazón?",
  "¿Existe alguna otra razón por la cual no debería participar en un programa de actividad física?",
];
