import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { userProfile } from "@/lib/mock-data";
import { ChangeEvent, useEffect, useState } from "react";
import { CheckCircle2, HeartPulse, Pencil } from "lucide-react";
import { Goal, goalLabels } from "@/types/goals";
import { User } from "@/types/user";
import { getUserDetails, getQr, updateUser } from "@/services/user.service";
import { age } from "@/utils/age";

export const Route = createFileRoute("/perfil/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil — PyrosFit" },
      { name: "description", content: "Gestiona tus datos, objetivos y salud." },
    ],
  }),
  component: Perfil,
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

function Perfil() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [edition, setEdition] = useState(true);
  const [isStudent, setIsStudent] = useState(true);
  const [QrBase64, setQrBase64] = useState("");
  const [userData, setUserData] = useState<User | null>(null);
  const [userCompleteData, setUserCompleteData] = useState<User | null>(null);
  const { userId } = useParams({ from: "/perfil/$userId" });

  useEffect(() => {
    if (!userId || isNaN(Number(userId))) return;

    const fetchUserData = async () => {
      try {
        const user = await getUserDetails(Number(userId));
        const { student = {}, coach = {} } = user;

        setIsStudent(student ? true : false);

        if (student) {
          setUserData({
            ...userData,
            firstName: student.firstName,
            lastName: student.lastName,
            age: age(student.birthdate),
            streak: 12,
            student: {
              id: student.id,
              userId: student.userId,
              weight: student.weight,
              height: student.height,
              fitnessGoal: student.fitnessGoal,
              bodyFatPercentage: student.bodyFatPercentage,
              activityLevel: student.activityLevel,
              medicalConditions: student.medicalConditions,
              allergies: student.allergies,
              fitnessExperience: student.fitnessExperience,
              generalNotes: student.generalNotes,
            },
          });

          setUserCompleteData({
            ...userCompleteData,
            firstName: student.firstName,
            lastName: student.lastName,
            age: age(student.birthdate),
            streak: 12,
            student: {
              id: student.id,
              userId: student.userId,
              weight: student.weight,
              height: student.height,
              fitnessGoal: student.fitnessGoal,
              bodyFatPercentage: student.bodyFatPercentage,
              activityLevel: student.activityLevel,
              medicalConditions: student.medicalConditions,
              allergies: student.allergies,
              fitnessExperience: student.fitnessExperience,
              generalNotes: student.generalNotes,
            },
          });
        } else {
          const coachQr = await getQr(coach.id);
          const { base64 } = coachQr.data;
          setQrBase64(base64);

          setUserData({
            ...userData,
            firstName: coach.firstName,
          });
          setUserCompleteData({
            ...userCompleteData,
            firstName: coach.firstName,
          });
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;

    setUserData({ ...userData, [name]: value });
  };

  const handleRadioOnChange = (e: Goal) => {
    setUserData({ ...userData, student: { ...userData?.student, fitnessGoal: e } });
  };

  const handleSaveUser = async () => {
    if (userData) {
      setUserCompleteData(userData);
      const updatedUser = await updateUser(userData);
    }
    setEdition(true);
    alert("Cambios guardados (simulado)");
  };

  const handleCancel = () => {
    setUserData(userCompleteData);
    setEdition(true);
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
                <p className="text-sm text-muted-foreground">Cliente · Plan Pro</p>
                <p className="text-sm text-muted-foreground">{userData?.coach?.bio}</p>
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
                  onChange={(e) => handleInputOnChange(e)}
                  value={`${userData?.student?.weight}`}
                  // defaultValue={`${userData?.weight || userProfile.weight}`}
                  disabled={edition}
                  type="number"
                />
                <Field
                  name="height"
                  key="f-height"
                  label="Altura (cm)"
                  onChange={(e) => handleInputOnChange(e)}
                  value={`${userData?.student?.height}`}
                  // defaultValue={`${userData?.weight || userProfile.weight}`}
                  disabled={edition}
                  type="number"
                />
                <Field
                  key="f-fatPercentage"
                  label="% de grasa"
                  name="bodyFatPercentage"
                  onChange={(e) => handleInputOnChange(e)}
                  value={`${userData?.student?.bodyFatPercentage}`}
                  // defaultValue={userData?.name || userProfile.name}
                  disabled={edition}
                  type="number"
                />
                <Field
                  name="activityLevel"
                  key="f-activityLevel"
                  label="Nivel de actividad"
                  onChange={(e) => handleInputOnChange(e)}
                  value={userData?.student?.activityLevel}
                  // defaultValue={`${userData?.age}`}
                  disabled={edition}
                />
                <Field
                  name="medicalConditions"
                  key="f-medicalConditions"
                  label="Condiciones medicas"
                  onChange={(e) => handleInputOnChange(e)}
                  value={userData?.student?.medicalConditions}
                  // defaultValue={userData?.medicalConditions}
                  disabled={true}
                />
                <Field
                  name="allergies"
                  key="f-allergies"
                  label="Alergias"
                  onChange={(e) => handleInputOnChange(e)}
                  value={userData?.student?.allergies}
                  // defaultValue={userData?.allergies}
                  disabled={edition}
                />
                <Field
                  name="fitnessExperience"
                  key="f-fitnessExperience"
                  label="Experiencia"
                  onChange={(e) => handleInputOnChange(e)}
                  value={userData?.student?.fitnessExperience}
                  // defaultValue={userData?.fitnessExperience}
                  disabled={true}
                />
                <Field
                  name="generalNotes"
                  key="f-generalNotes"
                  label="Notas"
                  onChange={(e) => handleInputOnChange(e)}
                  value={userData?.student?.generalNotes}
                  // defaultValue={userData?.generalNotes}
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
                value={goal}
                onValueChange={(v) => {
                  setGoal(v as Goal);

                  handleRadioOnChange(v as Goal);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {(Object.keys(goalLabels) as Goal[]).map((g) => (
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
                ))}
              </RadioGroup>
            </Card>
          </>
        )}

        {QrBase64 && (
          <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
            <h3 className="mb-4 font-bold text-lg">Tu Código de Acceso</h3>

            {QrBase64 ? (
              <img
                src={`data:image/png;base64,${QrBase64}`}
                alt="Código QR de alumno"
                className="w-64 h-64 border-4 border-white rounded-md shadow-xl"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 animate-pulse flex items-center justify-center">
                Generando QR...
              </div>
            )}

            <p className="mt-2 text-sm text-muted-foreground">Muéstraselo a tus alumnos</p>
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
    </AppShell>
  );
}
