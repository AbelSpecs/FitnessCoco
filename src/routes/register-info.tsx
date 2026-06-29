import { createFileRoute } from "@tanstack/react-router";
import { associateCoach, register } from "@/services/auth.service";
import { RegisterCredentials } from "@/types/auth";
import { PhoneCode } from "@/types/general";
import { getCountries } from "@/services/general.service";
import { notify } from "@/components/NotificationCenter";
import { Student } from "@/types/user";
import { createStudent } from "@/services/user.service";
import { SpinnerOverlay } from "@/components/Spinner";
import { CountryDto } from "@/dtos/countryDto";
import { RegistrationForm } from "@/components/forms/RegistrationForm";

type RegisterSearch = {
  coachId?: string;
};

export const Route = createFileRoute("/register-info")({
  head: () => ({
    meta: [
      { title: "Información Personal — PYROSFIT" },
      { name: "description", content: "Completa tu información personal en PYROSFIT" },
    ],
  }),
  loader: async () => {
    try {
      const countries: CountryDto[] = await getCountries();
      const phoneCodes: PhoneCode[] = countries.map((c) => {
        return { id: c.id, code: c.phoneCode };
      });

      return { countries, phoneCodes: phoneCodes };
    } catch (error) {
      console.error("Error al obtener los países:", error);
      throw error;
    }
  },
  pendingComponent: () => <SpinnerOverlay />,
  component: RegisterInfoPage,
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    return {
      coachId: search.coachId as string | undefined,
    };
  },
});

function RegisterInfoPage() {
  const { countries, phoneCodes } = Route.useLoaderData();
  const { coachId } = Route.useSearch();

  const handleRegisterStudent = async (formData: RegisterCredentials) => {
    try {
      const data = await register(formData);

      const studentData: Student = {
        userId: Number(data.id),
        weight: formData.weight,
        height: 0,
        bodyFatPercentage: 0,
        fitnessGoal: formData.fitnessGoal,
        activityLevel: "",
        medicalConditions: "",
        allergies: "",
        fitnessExperience: "",
        generalNotes: "",
        gymId: 1,
      };

      const clientData = await createStudent(studentData);

      await associateCoach({
        coachId: Number(coachId),
        studentId: Number(clientData.id),
        status: true,
      });

      notify.created("Usuario registrado!");
    } catch (error) {
      console.error("Error al registrar", error);
      notify.error("Error al registrar", "Intenta de nuevo");
      throw error;
    }
  };

  return (
    <RegistrationForm
      type="student"
      countries={countries}
      phoneCodes={phoneCodes}
      title="Información Personal"
      subtitle="Cuéntanos sobre ti para personalizar tu entrenamiento"
      successTitle="¡Información guardada!"
      successMessage={(form) => (
        <>
          Gracias <span className="text-foreground font-medium">{form.firstName}</span>,
          tus datos se han registrado correctamente.
        </>
      )}
      onSubmit={handleRegisterStudent}
    />
  );
}
