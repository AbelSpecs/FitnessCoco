import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { userProfile } from "@/lib/mock-data";
import { ChangeEvent, useEffect, useState } from "react";
import { CheckCircle2, HeartPulse, Pencil } from "lucide-react";
import { Goal, goalLabels } from "@/types/goals";
import { User } from "@/types/user";
import { getUser, postUser } from "@/services/user.service";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — FITYEI Training" },
      { name: "description", content: "Gestiona tus datos, objetivos y salud." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const [goal, setGoal] = useState<Goal>(userProfile.goal!);
  const [edition, setEdition] = useState(true);
  const [userData, setUserData] = useState<User | null>(userProfile);
  const [userCompleteData, setUserCompleteData] = useState<User | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserCompleteData(user);
      setGoal(user.goal!);
    }
  }, []);

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    console.log("Campo cambiado:", name, value);
    if (value) setUserData({ ...userData, [name]: value });
  };

  const handleRadioOnChange = (e: Goal) => {
    console.log(e);
    setUserData({ ...userData, goal: e });
  };

  const handleSaveUser = () => {
    console.log("Guardando usuario:", userData);
    if (userData) {
      setUserCompleteData(userData);
      postUser(userData);
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
              {userData?.name!.charAt(0) || userProfile.name!.charAt(0)}
            </div>
            <h2 className="font-display text-3xl mt-4">{userData?.name || userProfile.name}</h2>
            <p className="text-sm text-muted-foreground">Cliente · Plan Pro</p>
            <div className="grid grid-cols-3 gap-2 mt-6 text-center">
              <Stat label="Edad" value={`${userData?.age || userProfile.age}`} />
              <Stat label="Peso" value={`${userData?.weight || userProfile.weight} kg`} />
              <Stat label="Racha" value={`${userData?.streak || userProfile.streak}d`} />
            </div>
            <Button variant="glass" className="mt-6 w-full" onClick={() => setEdition(false)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </div>
        </Card>

        {/* Basic data */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <h3 className="font-display text-2xl mb-5">Datos básicos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              key="f-name"
              label="Nombre"
              name="name"
              onChange={(e) => handleInputOnChange(e)}
              defaultValue={userData?.name || userProfile.name}
              disabled={edition}
            />
            <Field
              name="age"
              key="f-age"
              label="Edad"
              onChange={(e) => handleInputOnChange(e)}
              defaultValue={`${userData?.age || userProfile.age}`}
              disabled={edition}
              type="number"
            />
            <Field
              name="weight"
              key="f-weight"
              label="Peso (kg)"
              onChange={(e) => handleInputOnChange(e)}
              defaultValue={`${userData?.weight || userProfile.weight}`}
              disabled={edition}
              type="number"
            />
            <Field
              name="gender"
              key="f-gender"
              label="Género"
              onChange={(e) => handleInputOnChange(e)}
              defaultValue={userData?.gender || userProfile.gender}
              disabled={edition}
            />
          </div>
        </Card>

        {/* Goals */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <h3 className="font-display text-2xl mb-5">Objetivos</h3>
          <RadioGroup
            value={goal}
            onValueChange={(v) => {
              setGoal(v as Goal);
              console.log("Objetivo cambiado:", v);
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
                <RadioGroupItem value={g} id={g} className="border-current" disabled={edition} />
                <span className="font-medium">{goalLabels[g]}</span>
              </div>
            ))}
          </RadioGroup>
        </Card>

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

        <div className="lg:col-span-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={handleSaveUser}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
