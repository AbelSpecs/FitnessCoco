import { createFileRoute, Link, redirect, useParams, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weekPlan } from "@/lib/mock-data";
import { Calendar, ChevronRight, Clock, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, Exercise } from "@/types/exercises";
import { determineDate, determineDates } from "@/utils/determineDate";
import {
  getDailyStudentExercisesByStudentId,
  getDailyStudentExercisesByStudentIdAndDate,
} from "@/services/routine.service";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import DatePicker from "@/components/DatePicker";
import { DateRange } from "react-day-picker";

export const Route = createFileRoute("/rutina/$studentId/")({
  head: () => ({
    meta: [
      { title: "Rutina semanal — PYROSFIT" },
      { name: "description", content: "Tu calendario de entrenamiento de la semana." },
    ],
  }),
  component: RutinaPage,
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");
    const role = auth && JSON.parse(auth).role !== "student";

    if (role) {
      throw new Error("Unauthorized");
    }

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
  // const { user } = useAuthStore();
  const { studentId } = useParams({ from: "/rutina/$studentId/" });
  const [selectedDateSearch, setSelectedDateSearch] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [weekRoutineList, setWeekRoutineList] = useState<Exercise[]>([]);

  useEffect(() => {
    const fetchRoutinesData = async () => {
      try {
        const exercisesData: GetDailyStudentExerciseDto[] =
          await getDailyStudentExercisesByStudentIdAndDate(Number(studentId));

        const mappedExercises: Exercise[] = exercisesData.map((e) => {
          const completeDate: CompleteDate = determineDate(e.scheduledDate);

          const newExercise: Exercise = {
            dailyExerciseId: e.id,
            coachId: e.coachId,
            exerciseId: e.exerciseId,
            studentId: e.studentId,
            exerciseName: e.exerciseName,
            muscleGroupName: e.muscleGroupName,
            coachNotes: e.coachNotes,
            scheduledDate: e.scheduledDate,
            day: completeDate.day,
            short: completeDate.short,
            dailyExerciseSets: e.dailyExerciseSets as DailyExerciseSets[],
          };

          return newExercise;
        });

        setWeekRoutineList(mappedExercises);
      } catch (error) {
        console.error("Error fetching routine data:", error);
      }
    };

    fetchRoutinesData();
  }, [studentId]);

  const handleSearchDatePickerDate = (date: DateRange | undefined) => {
    if (!date) return;

    console.log(date);

    // const tzOffset = date.getTimezoneOffset() * 60000;

    // const localISOTime = new Date(date.getTime() - tzOffset);

    // const safeISOString = localISOTime.toISOString();

    // console.log(safeISOString);

    // setSelectedDateSearch(new Date(safeISOString));
  };

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
      <Card className="bg-gradient-card border-border p-4 sm:p-5 mb-4 flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-primary-glow" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow leading-tight">
              Fecha de los ejercicios
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Selecciona día para buscar rutinas asignadas a esa fecha.
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <DatePicker
            value={selectedDateSearch}
            onChange={(date) => handleSearchDatePickerDate(date)}
            placeholder="Elegir fecha"
            size="lg"
            className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
            mode="range"
          />
        </div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {weekRoutineList.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <Link key={day.id} to="/rutina/$dayId" params={{ dayId: day.id! }} className="group">
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
                      {day.exercises!.length} ej.
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
