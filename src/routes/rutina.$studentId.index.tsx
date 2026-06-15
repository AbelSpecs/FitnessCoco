import {
  createFileRoute,
  Link,
  redirect,
  useParams,
  notFound,
  Outlet,
} from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weekPlan } from "@/lib/mock-data";
import { Calendar, ChevronRight, Clock, Dumbbell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, DayRoutine, Exercise } from "@/types/exercises";
import { determineDate, determineDates } from "@/utils/determineDate";
import { getDailyStudentExercisesByStudentIdAndDate } from "@/services/routine.service";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import WeekSlider from "@/components/ui/weekSlider";
import { addDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";
import { notify } from "@/components/NotificationCenter";

export const Route = createFileRoute("/rutina/$studentId/")({
  head: () => ({
    meta: [
      { title: "Rutina semanal — PYROSFIT" },
      { name: "description", content: "Tu calendario de entrenamiento de la semana." },
    ],
  }),
  component: RutinaPage,
  loader: async ({ params }) => {
    try {
      const mondayOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const dateStringParam = format(mondayOfThisWeek, "yyyy-MM-dd");

      const exercisesData: GetDailyStudentExerciseDto[] =
        await getDailyStudentExercisesByStudentIdAndDate(Number(params.studentId), dateStringParam);

      const mappedExercises: Exercise[] = exercisesData.map((e) => {
        const completeDate: CompleteDate = determineDate(e.scheduledDate);
        return {
          dailyExerciseId: e.id,
          coachId: e.coachId,
          exerciseId: e.exerciseId,
          studentId: e.studentId,
          exerciseName: e.exerciseName,
          muscleGroupName: e.muscleGroupName,
          coachNotes: e.coachNotes,
          studentNotes: e.studentNotes,
          isCompleted: e.isCompleted,
          scheduledDate: e.scheduledDate.split("T")[0],
          day: completeDate.day,
          short: completeDate.short,
          dailyExerciseSets: e.dailyExerciseSets as DailyExerciseSets[],
        };
      });

      const weekRoutineDays: DayRoutine[] = Array.from({ length: 7 }, (_, i) => {
        const currentDayDate = addDays(mondayOfThisWeek!, i);
        const dateString = format(currentDayDate, "yyyy-MM-dd");
        const dayName = format(currentDayDate, "EEEE", { locale: es });
        const dayShort = format(currentDayDate, "eeeeee", { locale: es });

        const dayExercises = mappedExercises.filter(
          (ex) => ex.scheduledDate.split("T")[0] === dateString,
        );

        const day: DayRoutine = {
          id: i,
          scheduledDate: dateString,
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          short: dayShort.charAt(0).toUpperCase(),
          estimated: "",
          rest: dayExercises.length > 0 ? false : true,
          muscleGroupName: dayExercises.length > 0 ? dayExercises[0].muscleGroupName : "Descanso",
          exercises: dayExercises,
        };

        return day;
      });
      return { weekRoutineDays: weekRoutineDays, studentId: params.studentId };
    } catch (error) {
      console.error(error);
      return { initialExercises: [] };
    }
  },
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
  const { weekRoutineDays: routine, studentId } = Route.useLoaderData();
  const [weekRoutineDays, setWeekRoutineDays] = useState(routine);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const handleWeekDate = async (date: Date | undefined) => {
    if (!date) return;

    try {
      const dateStringParam = format(date, "yyyy-MM-dd");
      const exercisesData: GetDailyStudentExerciseDto[] =
        await getDailyStudentExercisesByStudentIdAndDate(Number(studentId), dateStringParam);

      const mappedExercises: Exercise[] = exercisesData.map((e) => {
        const completeDate: CompleteDate = determineDate(e.scheduledDate);
        return {
          dailyExerciseId: e.id,
          coachId: e.coachId,
          exerciseId: e.exerciseId,
          studentId: e.studentId,
          exerciseName: e.exerciseName,
          muscleGroupName: e.muscleGroupName,
          coachNotes: e.coachNotes,
          studentNotes: e.studentNotes,
          isCompleted: e.isCompleted,
          scheduledDate: e.scheduledDate.split("T")[0],
          day: completeDate.day,
          short: completeDate.short,
          dailyExerciseSets: e.dailyExerciseSets as DailyExerciseSets[],
        };
      });

      const weekRoutineDays: DayRoutine[] = Array.from({ length: 7 }, (_, i) => {
        const currentDayDate = addDays(date!, i);
        const dateString = format(currentDayDate, "yyyy-MM-dd");
        const dayName = format(currentDayDate, "EEEE", { locale: es });
        const dayShort = format(currentDayDate, "eeeeee", { locale: es });

        const dayExercises = mappedExercises.filter(
          (ex) => ex.scheduledDate.split("T")[0] === dateString,
        );

        const day: DayRoutine = {
          id: i,
          scheduledDate: dateString,
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          short: dayShort.charAt(0).toUpperCase(),
          estimated: "",
          rest: dayExercises.length > 0 ? false : true,
          muscleGroupName: dayExercises.length > 0 ? dayExercises[0].muscleGroupName : "Descanso",
          exercises: dayExercises,
        };

        return day;
      });

      setWeekRoutineDays(weekRoutineDays);
    } catch (error) {
      console.error(error);
      notify.error("Error al actualzar", "Intenta de nuevo.");
      throw error;
    } finally {
      setSelectedDate(date);
    }
  };
  return (
    <AppShell>
      <WeekSlider
        value={selectedDate}
        onChange={handleWeekDate}
        weeksAfter={4}
        weeksBefore={4}
        className="mb-4"
      />
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
        {weekRoutineDays!.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <Link
              key={day.id}
              to="/rutina/$studentId/$dayId"
              params={{ studentId: studentId!, dayId: day.scheduledDate.split("T")[0]! }}
              className="group"
            >
              <Card
                className={`relative overflow-hidden p-6 h-full transition-all duration-300 hover:-translate-y-1 ${
                  isToday
                    ? "bg-gradient-primary border-primary-glow shadow-glow"
                    : day.short
                      ? "bg-card/40 border-border"
                      : "bg-gradient-card border-border hover:border-primary/50 hover:shadow-card"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70">
                      {isToday ? "Hoy" : day.name}
                    </p>
                    <p className="font-display text-5xl leading-none mt-1">{day.short}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-display text-2xl mb-3">{day.muscleGroupName}</h3>

                {day.rest ? (
                  <Badge variant="secondary" className="bg-muted/50">
                    Descanso
                  </Badge>
                ) : (
                  <div className="flex items-center gap-3 text-xs opacity-80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {day.estimated} min
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
