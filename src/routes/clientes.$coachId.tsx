import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Search, Users, Dumbbell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AppShell } from "@/components/AppShell";
import { getUserDetails } from "@/services/user.service";
import { Student, StudentInfo } from "@/types/user";
import { StudentDto, UserDto } from "@/dtos/userDto";
import { getStudents } from "@/services/student.service";
import { getCoachStudents } from "@/services/coach.service";

export const Route = createFileRoute("/clientes/$coachId")({
  head: () => ({
    meta: [
      { title: "Clientes — PyrosFit" },
      { name: "description", content: "Lista de clientes del entrenador." },
    ],
  }),
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
  component: ClientesPage,
});

function ClientesPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const getCoachClients = async () => {
      const studentsData = await getCoachStudents(Number(user?.coachId));
      const { students } = studentsData;

      const studentListMapped = students.map((item: StudentInfo) => {
        const clientList: StudentInfo = {
          studentId: item.studentId,
          name: item.name!,
          fitnessGoal: item.fitnessGoal!,
          plan: "basic",
          streak: 2,
        };

        return clientList;
      });

      setStudents(studentListMapped);
    };

    getCoachClients();
  }, [user?.coachId]);

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (c) => c.name.toLowerCase().includes(q) || c.fitnessGoal.toLowerCase().includes(q),
    );
  }, [query, students]);
  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link
            to="/perfil/$userId"
            params={{ userId: user?.id?.toString() ?? "" }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
              Entrenador
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl flex items-center gap-3">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary-glow" />
              Clientes
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Busca un cliente y entra a su rutina para revisarla o ajustarla.
            </p>
          </div>
          <div className="relative mb-5 sm:mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre u objetivo..."
              className="pl-10 h-12 bg-card/60 backdrop-blur-xl border-border focus-visible:ring-primary"
            />
          </div>
          {visibleClients.length === 0 ? (
            <Card className="bg-gradient-card border-border p-10 text-center">
              <p className="text-muted-foreground">No se encontraron clientes.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleClients.map((client) => (
                <Link
                  key={client.studentId}
                  to="/rutina/$studentId"
                  params={{ studentId: client.studentId.toString() ?? "" }}
                  className="group block"
                >
                  <Card className="bg-gradient-card border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-primary flex items-center justify-center font-display text-xl text-primary-foreground shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-xl sm:text-2xl leading-tight truncate">
                            {client.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="uppercase text-[10px] tracking-widest"
                          >
                            {client.plan}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                          {client.fitnessGoal}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3 text-primary-glow" />
                            Racha {client.streak} días
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary-glow group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
