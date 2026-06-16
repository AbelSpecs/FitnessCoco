import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChangeEvent, useEffect, useState } from "react";
import { CheckCircle2, HeartPulse, Pencil } from "lucide-react";
import { Goal, goalLabels } from "@/types/goals";
import { Student, User } from "@/types/user";
import { getUserDetails } from "@/services/user.service";
import { age } from "@/utils/age";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/components/NotificationCenter";
import Spinner, { SpinnerInline, SpinnerOverlay } from "@/components/Spinner";
import { updateStudent } from "@/services/student.service";
import { getQr } from "@/services/general.service";
import { userCoachMapper, userStudentMapper } from "@/mappers/user";

export const Route = createFileRoute("/perfil/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil — PyrosFit" },
      { name: "description", content: "Gestiona tus datos, objetivos y salud." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const user = await getUserDetails(Number(params.userId));
      const { student = {}, coach = {} } = user;

      if (student) {
        const userData: User = userStudentMapper(student);

        return { userData };
      } else {
        const coachQr = await getQr(coach.id);
        const { base64 } = coachQr.data;

        const BASE_URL = window.location.origin;
        const urlToShare = `${BASE_URL}/register-info?coachId=${coach.id}`;

        const userData: User = userCoachMapper(coach);

        return { userData, base64, urlToShare };
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },
  pendingComponent: () => <SpinnerOverlay />,
  pendingMs: 0,
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
  component: Perfil,
});

function Perfil() {
  const { userData: userInfo, base64: QrBase64, urlToShare: url } = Route.useLoaderData();
  const { isStudent } = userInfo;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [edition, setEdition] = useState(true);
  const [userData, setUserData] = useState<User | null>(userInfo);
  const [userCompleteData, setUserCompleteData] = useState<User | null>(userInfo);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value, name } = e.target;

    if (isStudent) setUserData({ ...userData!, student: { ...userData?.student, [name]: value } });
    else setUserData({ ...userData!, coach: { ...userData?.coach, [name]: value } });
  };

  const handleRadioOnChange = (e: Goal) => {
    setUserData({ ...userData!, student: { ...userData?.student, fitnessGoal: e } });
  };

  const handleSaveUser = async () => {
    setIsLoading(true);
    if (userData) {
      setUserCompleteData(userData);

      try {
        const updatedUser = await updateStudent(userData);
      } catch (error) {
        console.error("Error saving data:", error);
        notify.error("Error guardando la data");
      } finally {
        setIsLoading(false);
        setEdition(true);
        notify.success("Cambios guardados");
      }
    }
  };

  const handleCancel = () => {
    setUserData(userCompleteData);
    setEdition(true);
  };

  const handleShareLink = async () => {
    await navigator.clipboard.writeText(url!);
    notify.success("Enlace copiado al portapapeles");
  };

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Tu cuenta
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Identity */}
        <Card className="lg:col-span-1 bg-gradient-hero border-border p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-gradient-primary mx-auto flex items-center justify-center font-display text-5xl shadow-glow">
              {userData?.firstName!.charAt(0)}
            </div>
            <h2 className="font-display text-3xl mt-4">{userData?.firstName}</h2>
            {!isStudent && (
              <>
                <p className="text-sm text-muted-foreground">Entrenador</p>
                {/* <p className="text-sm text-muted-foreground">{userData?.coach?.bio}</p> */}
              </>
            )}
            {isStudent && (
              <>
                <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                  <Stat label="Edad" value={`${userData?.age}`} />
                  <Stat label="Peso" value={`${userData?.student?.weight} kg`} />
                  <Stat label="Racha" value={`${userData?.streak}d`} />
                </div>
                <Button variant="glass" className="mt-6 w-full" onClick={() => setEdition(false)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </>
            )}
            {/* {!isStudent && (
              <>
                {!edition ? (
                  <div className="flex flex-col items-center w-full">
                    <textarea
                      name="bio"
                      key="bio"
                      value={userData?.coach?.bio}
                      onChange={(e) => {
                        handleInputOnChange(e);
                      }}
                      rows={2}
                      className="w-full max-w-md p-3 text-sm rounded-lg border border-border bg-background/40 text-foreground resize-none outline-none focus:border-primary transition-all text-center"
                      placeholder="Escribe una bio"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 mt-6 text-center">
                    <Stat label="Bio" value={`${userData?.coach?.bio}`} />
                  </div>
                )}
                <Button variant="glass" className="mt-6 w-full" onClick={() => setEdition(false)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </>
            )} */}
          </div>
        </Card>

        {/* Basic data */}
        {isStudent && (
          <>
            <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
              <h3 className="font-display text-2xl mb-5">Datos básicos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  name="weight"
                  key="f-weight"
                  label="Peso (kg)"
                  onChange={(e) => handleInputChange(e)}
                  value={`${userData?.student?.weight}`}
                  disabled={edition}
                  type="number"
                />
                <Field
                  name="height"
                  key="f-height"
                  label="Altura (cm)"
                  onChange={(e) => handleInputChange(e)}
                  value={`${userData?.student?.height}`}
                  disabled={edition}
                  type="number"
                />
                <Field
                  key="f-fatPercentage"
                  label="% de grasa"
                  name="bodyFatPercentage"
                  onChange={(e) => handleInputChange(e)}
                  value={`${userData?.student?.bodyFatPercentage}`}
                  disabled={edition}
                  type="number"
                />
                <Field
                  name="activityLevel"
                  key="f-activityLevel"
                  label="Nivel de actividad"
                  onChange={(e) => handleInputChange(e)}
                  value={userData?.student?.activityLevel}
                  disabled={edition}
                />
                <Field
                  name="medicalConditions"
                  key="f-medicalConditions"
                  label="Condiciones medicas"
                  onChange={(e) => handleInputChange(e)}
                  value={userData?.student?.medicalConditions}
                  disabled={true}
                />
                <Field
                  name="allergies"
                  key="f-allergies"
                  label="Alergias"
                  onChange={(e) => handleInputChange(e)}
                  value={userData?.student?.allergies}
                  disabled={edition}
                />
                <Field
                  name="fitnessExperience"
                  key="f-fitnessExperience"
                  label="Experiencia"
                  onChange={(e) => handleInputChange(e)}
                  value={userData?.student?.fitnessExperience}
                  disabled={true}
                />
                <Field
                  name="generalNotes"
                  key="f-generalNotes"
                  label="Notas"
                  onChange={(e) => handleInputChange(e)}
                  value={userData?.student?.generalNotes}
                  disabled={true}
                />
              </div>
            </Card>
          </>
        )}

        {/* Goals */}
        {isStudent && (
          <>
            <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
              <h3 className="font-display text-2xl mb-5">Objetivos</h3>
              <RadioGroup
                value={userData?.student?.fitnessGoal as Goal}
                onValueChange={(v) => {
                  setGoal(v as Goal);

                  handleRadioOnChange(v as Goal);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {(Object.keys(goalLabels) as Goal[]).map((g) => {
                  return (
                    <div
                      key={g}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        goal === g
                          ? "bg-gradient-primary border-primary-glow shadow-glow text-primary-foreground"
                          : "bg-background/40 border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={g}
                        id={g}
                        className="border-current"
                        disabled={edition}
                      />
                      <span className="font-medium">{goalLabels[g]}</span>
                    </div>
                  );
                })}
              </RadioGroup>
            </Card>
          </>
        )}

        {QrBase64 && (
          <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
            <h3 className="mb-4 font-bold text-lg">Tu Código de Acceso</h3>

            {QrBase64 ? (
              <>
                <img
                  src={`data:image/png;base64,${QrBase64}`}
                  alt="Código QR de alumno"
                  className="w-64 h-64 border-4 border-white rounded-md shadow-xl"
                />
                <Button variant="outline" className="mt-4" onClick={handleShareLink}>
                  Compartir enlace
                </Button>
              </>
            ) : (
              <div className="w-64 h-64 bg-gray-200 animate-pulse flex items-center justify-center">
                Generando QR...
              </div>
            )}

            <p className="mt-2 text-sm text-muted-foreground">Muéstraselo a tus futuros clientes</p>
          </div>
        )}

        {/* Health */}
        {/* <Card className="lg:col-span-1 bg-gradient-card border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-2xl">Salud · PAR-Q</h3>
            <HeartPulse className="h-5 w-5 text-success" />
          </div>
          {userProfile.parqCompleted ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium">Completado</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Vigente hasta {userProfile.parqValidUntil}.
              </p>
              <Badge
                variant="secondary"
                className="mt-3 bg-success/15 text-success border-success/30"
              >
                Apto para entrenar
              </Badge>
              <Button variant="glass" className="w-full mt-4" asChild>
                <Link to="/par-q">Revisar cuestionario</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Aún no has completado el cuestionario de salud previo.
              </p>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/par-q">Completar PAR-Q</Link>
              </Button>
            </>
          )}
        </Card> */}

        {isStudent && (
          <>
            <div className="lg:col-span-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="hero"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleSaveUser}
              >
                Guardar cambios
              </Button>
            </div>
          </>
        )}
      </div>
      {isLoading && <SpinnerOverlay label={"Guardando..."} />}
    </AppShell>
  );
}
