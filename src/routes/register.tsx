import { createFileRoute } from "@tanstack/react-router";
import { register } from "@/services/auth.service";
import { getCountries } from "@/services/general.service";
import { PhoneCode } from "@/types/general";
import { RegisterCredentials } from "@/types/auth";
import { notify } from "@/components/NotificationCenter";
import { Coach } from "@/types/user";
import { createCoach } from "@/services/coach.service";
import { SpinnerOverlay } from "@/components/Spinner";
import { CountryDto } from "@/dtos/countryDto";
import { RegistrationForm } from "@/components/forms/RegistrationForm";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crear Cuenta — PYROSFIT" },
      { name: "description", content: "Crea tu cuenta en PYROSFIT" },
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
  component: RegisterPage,
});

function RegisterPage() {
  const { countries, phoneCodes } = Route.useLoaderData();

  const handleRegisterCoach = async (formData: RegisterCredentials) => {
    try {
      const data = await register(formData);

      const coachToCreate: Coach = {
        userId: data.id,
        bio: "",
        certifications: "",
      };

      await createCoach(coachToCreate);
      notify.created("Coach registrado!");
    } catch (error) {
      console.error("Error al registrar. Intenta nuevamente.", error);
      notify.error("Error", `Error al registrar. Intenta nuevamente.`);
      throw error;
    }
  };

  return (
    <RegistrationForm
      type="coach"
      countries={countries}
      phoneCodes={phoneCodes}
      title="Crear Cuenta"
      subtitle=""
      successTitle="¡Revisa tu email!"
      successMessage={(form) => (
        <>
          Hemos enviado un enlace de confirmación a{" "}
          <span className="text-foreground font-medium">{form.email}</span>. Confirma para empezar.
        </>
      )}
      onSubmit={handleRegisterCoach}
    />
  );
}
