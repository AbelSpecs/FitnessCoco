import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weekPlan } from "@/lib/mock-data";
import { ChevronRight, Clock, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { getExercises, getRoutine } from "@/services/routine.service";
import { useAuthStore } from "@/store/authStore";
import { BadExercise, BadRoutine, DayRoutine, Exercise } from "@/types/exercises";

export const Route = createFileRoute("/rutina/")({
  head: () => ({
    meta: [
      { title: "Rutina semanal — PYROSFIT" },
      { name: "description", content: "Tu calendario de entrenamiento de la semana." },
    ],
  }),
  component: RutinaPage,
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");

    if (!auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

function RutinaPage() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const { user } = useAuthStore();
  const [weekRoutineList, setWeekRoutineList] = useState<DayRoutine[]>([]);

  useEffect(() => {
    const fetchRoutinesData = async () => {
      try {
        const exercisesData: BadExercise[] = await getExercises(user!.studentId);

        const exerciseIds = [
          ...new Set(exercisesData.map((item: BadExercise) => item.exerciseId)),
        ] as number[];

        const dates = [...new Set(exercisesData.map((item) => item.scheduledDate))];

        const completeDates = dates.map((date) => {
          const newFecha = new Date(date);

          const completeName = newFecha.toLocaleDateString("es-ES", {
            weekday: "long",
            timeZone: "UTC",
          });

          const initial = newFecha.toLocaleDateString("es-ES", {
            weekday: "narrow",
            timeZone: "UTC",
          });

          return {
            day: completeName,
            short: initial,
            original: date,
          };
        });

        const mappedExercises = exercisesData.map((e, id: number) => {
          const newExercise: Exercise = {
            id,
            coachId: e.coachId,
            exerciseId: e.exerciseId,
            name: `Ejercicio de la chancla ${id}`,
            description: `Prueba ${id}`,
            muscle: `Prueba ${id}`,
            sets: e.sets,
            reps: e.reps,
            restSec: Number(e.restTime),
          };

          return newExercise;
        });

        for (let i = 0; i <= exerciseIds.length - 1; i++) {
          const routineData = await getRoutine(exerciseIds[i]);

          const foundDate = exercisesData.find(
            (e) => e.exerciseId === exerciseIds[i],
          )?.scheduledDate;
          const completeRoutineData: DayRoutine = {
            id: exerciseIds[i].toString(),
            day: completeDates.find((date) => date.original === foundDate)!.day,
            short: completeDates.find((date) => date.original === foundDate)!.short,
            focus: routineData.name,
            durationMin: 20,
            exercises: mappedExercises.filter((e) => e.exerciseId === exerciseIds[i]),
          };

          setWeekRoutineList((prevDay) => {
            const listWithoutDuplicate = prevDay.filter(
              (item) => item.id !== completeRoutineData.id,
            );

            return [...listWithoutDuplicate, completeRoutineData];
          });
        }

        // const weekPlan: DayRoutine[] = [
        //   {
        //     id: string;
        //       day: string;
        //       short: string;
        //       focus: string;
        //       durationMin: number;
        //       exercises: Exercise[];
        //       rest?: boolean;
        //   }
        // ]
      } catch (error) {
        console.error("Error fetching routine data:", error);
      }
    };

    fetchRoutinesData();
  }, [user]);

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Tu programa
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Rutina semanal</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Pulsa cualquier día para ver los ejercicios, registrar tu sesión y consultar el historial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {weekRoutineList.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <Link key={day.id} to="/rutina/$dayId" params={{ dayId: day.id }} className="group">
              <Card
                className={`relative overflow-hidden p-6 h-full transition-all duration-300 hover:-translate-y-1 ${
                  isToday
                    ? "bg-gradient-primary border-primary-glow shadow-glow"
                    : day.rest
                      ? "bg-card/40 border-border"
                      : "bg-gradient-card border-border hover:border-primary/50 hover:shadow-card"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70">
                      {isToday ? "Hoy" : day.day}
                    </p>
                    <p className="font-display text-5xl leading-none mt-1">{day.short}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-display text-2xl mb-3">{day.focus}</h3>

                {day.rest ? (
                  <Badge variant="secondary" className="bg-muted/50">
                    Descanso
                  </Badge>
                ) : (
                  <div className="flex items-center gap-3 text-xs opacity-80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {day.durationMin} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {day.exercises.length} ej.
                    </span>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
