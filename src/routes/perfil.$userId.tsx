import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  Link2,
  Pencil,
  QrCode,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Goal, goalLabels } from "@/types/goals";
import { User } from "@/types/user";
import { getUserDetails, updateProfilePictures } from "@/services/user.service";
import { notify } from "@/components/NotificationCenter";
import { SpinnerOverlay } from "@/components/Spinner";
import { updateStudent } from "@/services/student.service";
import { getCoachProfile, updateCoach } from "@/services/coach.service";
import { getQr } from "@/services/general.service";
import { userCoachMapper, userStudentMapper } from "@/mappers/user";
import {
  getFileContentType,
  getPresignedBannerUrl,
  getPresignedProfileUrl,
  getServeUrl,
  uploadFileToPresignedUrl,
} from "@/services/storage.service";
import StorageImage from "@/components/StorageImage";

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
      const { student = null, coach = null, profilePictureKey, bannerPictureKey } = user;

      const profileKey =
        profilePictureKey || coach?.profilePictureKey || student?.profilePictureKey;
      const bannerKey = bannerPictureKey || coach?.bannerPictureKey || student?.bannerPictureKey;

      const profilePictureUrl = profileKey ? getServeUrl(profileKey) : undefined;
      const bannerPictureUrl = bannerKey ? getServeUrl(bannerKey) : undefined;

      if (student) {
        const userData: User = userStudentMapper(student);
        userData.profilePictureKey = profileKey;
        userData.bannerPictureKey = bannerKey;
        userData.profilePictureUrl = profilePictureUrl;
        userData.bannerPictureUrl = bannerPictureUrl;

        return { userData };
      } else {
        const coachQr = await getQr(coach?.id || 1);
        const { base64 } = coachQr.data;

        const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
        const urlToShare = `${BASE_URL}/register-info?coachId=${coach?.id || ""}`;

        let coachData = coach;
        if (coach?.id) {
          try {
            const profile = await getCoachProfile(coach.id);
            if (profile) {
              coachData = { ...coach, ...profile };
            }
          } catch (err) {
            console.warn("No se pudieron cargar las métricas dinámicas del coach en el loader:", err);
          }
        }

        const userData: User = userCoachMapper(coachData || {});
        userData.profilePictureKey = profileKey;
        userData.bannerPictureKey = bannerKey;
        userData.profilePictureUrl = profilePictureUrl;
        userData.bannerPictureUrl = bannerPictureUrl;

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
  const { userId } = useParams({ from: "/perfil/$userId" });
  const { isStudent } = userInfo;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [edition, setEdition] = useState(true);
  const [userData, setUserData] = useState<User | null>(userInfo);
  const [userCompleteData, setUserCompleteData] = useState<User | null>(userInfo);
  const [isLoading, setIsLoading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = Number(userId) || userData?.id || 1;

  useEffect(() => {
    // Si el usuario es entrenador, invocar asíncronamente las estadísticas del endpoint de Swagger
    const coachId = userData?.coach?.id || userInfo?.coach?.id;
    if (!isStudent && coachId) {
      getCoachProfile(coachId)
        .then((profile) => {
          if (profile) {
            setUserData((prev) => {
              if (!prev || !prev.coach) return prev;
              return {
                ...prev,
                coach: {
                  ...prev.coach,
                  activeStudents: profile.activeStudents,
                  totalStudents: profile.totalStudents,
                  totalRoutinesCreated: profile.totalRoutinesCreated,
                  averageRating: profile.averageRating,
                  totalRatingsCount: profile.totalRatingsCount,
                  experienceYears: profile.yearsOfExperience ?? prev.coach.experienceYears ?? 0,
                },
              };
            });
          }
        })
        .catch((err) => {
          console.warn("Error al cargar estadísticas asíncronas del entrenador:", err);
        });
    }
  }, [isStudent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value, name } = e.target;

    if (isStudent) {
      setUserData((prev) =>
        prev ? { ...prev, student: { ...prev.student, [name]: value } } : prev,
      );
    } else {
      setUserData((prev) => (prev ? { ...prev, coach: { ...prev.coach, [name]: value } } : prev));
    }
  };

  const handleRadioOnChange = (e: Goal) => {
    setUserData((prev) =>
      prev ? { ...prev, student: { ...prev.student, fitnessGoal: e } } : prev,
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error("La imagen no debe superar los 5MB");
      return;
    }

    setIsLoading(true);

    try {
      notify.info("Subiendo foto de perfil...");
      const contentType = getFileContentType(file);
      // 1. Obtener URL presignada
      const presign = await getPresignedProfileUrl({
        userId: currentUserId,
        fileName: file.name,
        contentType,
        expiresInSeconds: 300,
      });

      // 2. Subida binaria directa a Cloudflare R2 / S3
      await uploadFileToPresignedUrl(presign.uploadUrl, file, contentType);

      // 3. Persistir key en base de datos
      await updateProfilePictures(currentUserId, {
        profilePicture: presign.key,
        bannerPicture: userData?.bannerPictureKey || userData?.coach?.bannerPicture || null,
      });

      // 4. Actualizar estado local
      const newProfileUrl = getServeUrl(presign.key);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              profilePictureKey: presign.key,
              profilePictureUrl: newProfileUrl,
              coach: prev.coach
                ? {
                    ...prev.coach,
                    profilePictureKey: presign.key,
                    profilePictureUrl: newProfileUrl,
                  }
                : undefined,
            }
          : prev,
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pyrosfit_avatar_updated", {
            detail: { key: presign.key, url: newProfileUrl },
          }),
        );
      }

      notify.success("¡Foto de perfil actualizada con éxito!");
    } catch (error: any) {
      console.error("Error al actualizar foto de perfil:", error);
      notify.error("No se pudo actualizar la foto de perfil. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error("La imagen no debe superar los 5MB");
      return;
    }

    const trainerId = userData?.coach?.id || 1;
    setIsLoading(true);

    try {
      notify.info("Subiendo imagen de portada...");
      const contentType = getFileContentType(file);
      // 1. Obtener URL presignada para banner
      const presign = await getPresignedBannerUrl({
        trainerId,
        fileName: file.name,
        contentType,
        expiresInSeconds: 300,
      });

      // 2. Subida binaria directa a Cloudflare R2 / S3
      await uploadFileToPresignedUrl(presign.uploadUrl, file, contentType);

      // 3. Persistir key en base de datos
      await updateProfilePictures(currentUserId, {
        profilePicture: userData?.profilePictureKey || null,
        bannerPicture: presign.key,
      });

      // 4. Actualizar estado local
      const newBannerUrl = getServeUrl(presign.key);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              bannerPictureKey: presign.key,
              bannerPictureUrl: newBannerUrl,
              coach: prev.coach
                ? {
                    ...prev.coach,
                    bannerPictureKey: presign.key,
                    bannerPictureUrl: newBannerUrl,
                  }
                : undefined,
            }
          : prev,
      );

      notify.success("¡Banner actualizado con éxito!");
    } catch (error: any) {
      console.error("Error al subir el banner:", error);
      notify.error("No se pudo actualizar el banner. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const handleRemoveBanner = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      await updateProfilePictures(currentUserId, {
        profilePicture: userData?.profilePictureKey || null,
        bannerPicture: null,
      });

      setUserData((prev) =>
        prev
          ? {
              ...prev,
              bannerPictureKey: undefined,
              bannerPictureUrl: undefined,
              coach: prev.coach
                ? {
                    ...prev.coach,
                    bannerPictureKey: undefined,
                    bannerPictureUrl: undefined,
                    bannerPicture: undefined,
                    bannerUrl: undefined,
                  }
                : undefined,
            }
          : prev,
      );
      notify.info("Banner eliminado");
    } catch (err) {
      console.error("Error al eliminar banner:", err);
      notify.error("No se pudo eliminar el banner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async () => {
    setIsLoading(true);
    try {
      if (isStudent) {
        if (userData) {
          await updateStudent(userData);
          setUserCompleteData(userData);
          notify.success("Cambios guardados");
        }
      } else {
        if (userData?.coach) {
          await updateCoach({
            ...userData.coach,
            profilePicture: userData.profilePictureKey || userData.coach.profilePicture,
            bannerPicture:
              userData.bannerPictureKey || userData.coach.bannerPicture || userData.coach.bannerUrl,
          });
          setUserCompleteData(userData);
          notify.success("Perfil de entrenador guardado");
        }
      }
      setEdition(true);
    } catch (error) {
      console.error("Error saving data:", error);
      notify.error("Error guardando los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUserData(userCompleteData);
    setEdition(true);
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleShareLink = async () => {
    const coachId = userData?.coach?.id || userInfo?.coach?.id;
    const fallbackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/register-info?coachId=${coachId || ""}`
        : "";
    const targetUrl = url || fallbackUrl;

    if (!targetUrl) {
      notify.error("No se pudo obtener el enlace de registro");
      return;
    }

    try {
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      notify.success("Enlace copiado al portapapeles");
      setTimeout(() => {
        setIsCopied(false);
      }, 2500);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
      notify.error("No se pudo copiar el enlace automáticamente");
    }
  };

  const currentBannerKey =
    userData?.bannerPictureKey ||
    userData?.coach?.bannerPictureKey ||
    userData?.coach?.bannerPicture ||
    userData?.coach?.bannerUrl;
  const currentBannerUrl =
    userData?.bannerPictureUrl || (currentBannerKey ? getServeUrl(currentBannerKey) : undefined);

  const currentProfileKey =
    userData?.profilePictureKey ||
    userData?.coach?.profilePictureKey ||
    userData?.coach?.profilePicture;
  const currentProfileUrl =
    userData?.profilePictureUrl || (currentProfileKey ? getServeUrl(currentProfileKey) : undefined);

  return (
    <AppShell>
      {/* Hidden file input for Avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Tu cuenta
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Perfil</h1>
      </div>

      {!isStudent && (
        <Card className="mb-6 sm:mb-8 border-border relative overflow-hidden bg-card shadow-elevated">
          {/* Banner Container */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-gradient-hero group">
            {currentBannerUrl || currentBannerKey ? (
              <StorageImage
                src={currentBannerUrl}
                storageKey={currentBannerKey}
                alt="Banner del entrenador"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                containerClassName="w-full h-full"
                fallback={
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 via-background to-primary/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
                    <div className="relative flex flex-col items-center gap-1.5 text-muted-foreground/70">
                      <ImagePlus className="h-8 w-8 text-primary/60" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Sin imagen de banner
                      </span>
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-background to-primary/10 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
                <div className="relative flex flex-col items-center gap-1.5 text-muted-foreground/70">
                  <ImagePlus className="h-8 w-8 text-primary/60" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Sin imagen de banner
                  </span>
                </div>
              </div>
            )}

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none" />

            {/* Hidden file input for Banner */}
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />

            {/* Banner action buttons (top right) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {currentBannerKey && (
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={handleRemoveBanner}
                  className="h-8 px-2.5 bg-black/60 hover:bg-destructive/80 hover:text-destructive-foreground backdrop-blur-md border-white/10 text-xs gap-1.5 text-muted-foreground cursor-pointer"
                  title="Eliminar banner"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Quitar</span>
                </Button>
              )}
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                className="h-8 px-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border-white/10 text-xs gap-1.5 shadow-glow cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-primary-glow" />
                <span>{currentBannerKey ? "Cambiar banner" : "Subir banner"}</span>
              </Button>
            </div>
          </div>

          {/* Profile Header Content (overlapping banner) */}
          <div className="relative px-6 pb-6 sm:px-10 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8 -mt-14 sm:-mt-16">
              {/* Avatar with Camera Overlay */}
              <div
                className="relative group/avatar cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
                title="Cambiar foto de perfil"
              >
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-card/80 backdrop-blur-md border border-border/60 flex items-center justify-center font-display text-5xl shadow-elevated ring-4 ring-background shrink-0 overflow-hidden relative">
                  <StorageImage
                    src={currentProfileUrl}
                    storageKey={currentProfileKey}
                    alt={userData?.firstName || "Coach"}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full flex items-center justify-center bg-transparent"
                    fallback={
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center shadow-glow">
                        <span className="text-primary-foreground font-display text-4xl sm:text-5xl">
                          {userData?.firstName?.charAt(0) || "C"}
                        </span>
                      </div>
                    }
                  />
                  {/* Hover overlay with camera icon */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white z-10">
                    <Camera className="h-6 w-6 text-primary-glow" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                      Cambiar
                    </span>
                  </div>
                </div>
                {/* Small camera badge */}
                <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-xl bg-card border border-border flex items-center justify-center shadow-md group-hover/avatar:scale-110 transition-transform z-20">
                  <Camera className="h-3.5 w-3.5 text-primary-glow" />
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-primary-glow font-medium">
                    Entrenador certificado
                  </span>
                  {userData?.coach?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success border border-success/30 px-2 py-0.5 text-[10px] font-medium">
                      <BadgeCheck className="h-3 w-3" /> Verificado
                    </span>
                  )}
                </div>
                <h2 className="font-display text-3xl sm:text-5xl leading-none truncate">
                  {userData?.firstName} {userData?.lastName}
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-muted-foreground italic max-w-2xl">
                  “{userData?.coach?.bio || "Entrena con propósito. Progresa sin excusas."}”
                </p>
              </div>

              {/* Header Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {edition ? (
                  <Button variant="glass" onClick={() => setEdition(false)}>
                    <Pencil className="h-4 w-4 text-primary-glow" /> Editar marca
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                )}
                <Button variant="hero" asChild>
                  <Link to="/clients">
                    <Users className="h-4 w-4" /> Mis alumnos
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-8">
              <Stat
                label="Alumnos"
                value={`${userData?.coach?.activeStudents ?? userData?.coach?.totalStudents ?? userData?.coach?.studentsCount ?? 0}`}
              />
              <Stat
                label="Rutinas"
                value={`${userData?.coach?.totalRoutinesCreated ?? userData?.coach?.routinesCount ?? 0}`}
              />
              <Stat
                label="Valoración"
                value={
                  typeof userData?.coach?.averageRating === "number" && userData.coach.averageRating > 0
                    ? userData.coach.averageRating.toFixed(1)
                    : typeof userData?.coach?.rating === "number" && userData.coach.rating > 0
                      ? userData.coach.rating.toFixed(1)
                      : "N/A"
                }
              />
              <Stat
                label="Experiencia"
                value={`${userData?.coach?.experienceYears ?? 0} ${
                  (userData?.coach?.experienceYears ?? 0) === 1 ? "año" : "años"
                }`}
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Student Identity */}
        {isStudent && (
          <Card className="lg:col-span-1 bg-gradient-hero border-border p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
            <div className="relative">
              {/* Student Avatar with Camera Overlay */}
              <div
                className="relative group/avatar cursor-pointer mx-auto w-28 h-28"
                onClick={() => avatarInputRef.current?.click()}
                title="Cambiar foto de perfil"
              >
                <div className="h-28 w-28 rounded-full bg-card/80 backdrop-blur-md border border-border/60 mx-auto flex items-center justify-center font-display text-5xl shadow-elevated overflow-hidden relative ring-4 ring-background">
                  <StorageImage
                    src={currentProfileUrl}
                    storageKey={currentProfileKey}
                    alt={userData?.firstName || "Usuario"}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full flex items-center justify-center bg-transparent"
                    fallback={
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center shadow-glow">
                        <span className="text-primary-foreground font-display text-5xl">
                          {userData?.firstName?.charAt(0) || "U"}
                        </span>
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white z-10">
                    <Camera className="h-6 w-6 text-primary-glow" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                      Cambiar
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center shadow-md group-hover/avatar:scale-110 transition-transform z-20">
                  <Camera className="h-4 w-4 text-primary-glow" />
                </div>
              </div>

              <h2 className="font-display text-3xl mt-4">{userData?.firstName}</h2>

              <div className="grid grid-cols-2 gap-2 mt-6 text-center">
                <Stat label="Edad" value={`${userData?.age ?? "-"}`} />
                <Stat label="Peso" value={`${userData?.student?.weight ?? "-"} kg`} />
              </div>
              {edition && (
                <Button variant="glass" className="mt-6 w-full" onClick={() => setEdition(false)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Student Basic Data */}
        {isStudent && (
          <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
            <h3 className="font-display text-2xl mb-5">Datos básicos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                name="weight"
                key="f-weight"
                label="Peso (kg)"
                onChange={handleInputChange}
                value={`${userData?.student?.weight ?? ""}`}
                disabled={edition}
                type="number"
              />
              <Field
                name="height"
                key="f-height"
                label="Altura (cm)"
                onChange={handleInputChange}
                value={`${userData?.student?.height ?? ""}`}
                disabled={edition}
                type="number"
              />
              <Field
                key="f-fatPercentage"
                label="% de grasa"
                name="bodyFatPercentage"
                onChange={handleInputChange}
                value={`${userData?.student?.bodyFatPercentage ?? ""}`}
                disabled={edition}
                type="number"
              />
              <Field
                name="activityLevel"
                key="f-activityLevel"
                label="Nivel de actividad"
                onChange={handleInputChange}
                value={userData?.student?.activityLevel ?? ""}
                disabled={edition}
              />
              <Field
                name="medicalConditions"
                key="f-medicalConditions"
                label="Condiciones medicas"
                onChange={handleInputChange}
                value={userData?.student?.medicalConditions ?? ""}
                disabled={edition}
              />
              <Field
                name="allergies"
                key="f-allergies"
                label="Alergias"
                onChange={handleInputChange}
                value={userData?.student?.allergies ?? ""}
                disabled={edition}
              />
              <Field
                name="fitnessExperience"
                key="f-fitnessExperience"
                label="Experiencia"
                onChange={handleInputChange}
                value={userData?.student?.fitnessExperience ?? ""}
                disabled={true}
              />
              <Field
                name="generalNotes"
                key="f-generalNotes"
                label="Notas"
                onChange={handleInputChange}
                value={userData?.student?.generalNotes ?? ""}
                disabled={true}
              />
            </div>
          </Card>
        )}

        {/* Student Goals */}
        {isStudent && (
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
                      (userData?.student?.fitnessGoal || goal) === g
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
        )}

        {/* Coach Brand & Info */}
        {!isStudent && (
          <Card className="lg:col-span-2 bg-gradient-card border-border p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary-glow" />
                <h3 className="font-display text-2xl">Sobre mi marca</h3>
              </div>
              {!edition && (
                <span className="text-xs text-primary-glow font-medium bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  Editando información
                </span>
              )}
            </div>

            {edition ? (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 font-semibold">
                    Eslogan / Biografía
                  </p>
                  <p className="text-lg font-display text-foreground/90">
                    {userData?.coach?.bio || "Entrena con propósito. Progresa sin excusas."}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-semibold">
                    Certificaciones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(userData?.coach?.certifications
                      ? userData.coach.certifications.split(",").filter((c) => c.trim().length > 0)
                      : ["Personal Trainer", "Nutrición deportiva"]
                    ).map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-border bg-background/50 px-3.5 py-1 text-xs text-foreground/80 shadow-sm"
                      >
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <Stat label="Sesiones/semana" value="32" />
                  <Stat label="Retención" value="92%" />
                  <Stat label="Racha media" value="11d" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-1.5">
                    Eslogan / Biografía
                  </label>
                  <Textarea
                    name="bio"
                    value={userData?.coach?.bio || ""}
                    onChange={handleInputChange}
                    placeholder="Ej: Entrena con propósito. Progresa sin excusas."
                    rows={3}
                    className="bg-background/50 border-border focus:border-primary resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Describe tu filosofía o presentación profesional brevemente.
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-1.5">
                    Certificaciones
                  </label>
                  <Input
                    name="certifications"
                    value={userData?.coach?.certifications || ""}
                    onChange={handleInputChange}
                    placeholder="Personal Trainer, Nutrición deportiva, Crossfit L1"
                    className="bg-background/50 border-border focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Ingresa tus títulos o acreditaciones separados por comas.
                  </p>

                  {/* Live tag preview */}
                  {userData?.coach?.certifications && (
                    <div className="mt-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Vista previa de etiquetas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {userData.coach.certifications
                          .split(",")
                          .filter((c) => c.trim().length > 0)
                          .map((c, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-primary/30 bg-primary/10 text-primary-glow px-2.5 py-0.5 text-xs font-medium"
                            >
                              {c.trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-1.5">
                    Años de experiencia
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    name="experienceYears"
                    value={userData?.coach?.experienceYears ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setUserData((prev) =>
                        prev
                          ? {
                              ...prev,
                              coach: {
                                ...prev.coach,
                                experienceYears: isNaN(val) ? 0 : val,
                              },
                            }
                          : prev,
                      );
                    }}
                    placeholder="Ej: 5"
                    className="bg-background/50 border-border focus:border-primary w-full sm:w-36"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Años de trayectoria ejerciendo como entrenador.
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Coach QR Access Code & Link */}
        {!isStudent && (
          <Card className="lg:col-span-1 bg-gradient-hero border-border p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
            <div className="relative flex flex-col items-center w-full">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-primary-glow" />
                <h3 className="font-display text-2xl">Código de acceso</h3>
              </div>
              {QrBase64 ? (
                <img
                  src={`data:image/png;base64,${QrBase64}`}
                  alt="Código QR del entrenador"
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl border border-border bg-background p-2 shadow-elevated transition-transform hover:scale-105"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl bg-background/40 border border-border animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                  Generando QR...
                </div>
              )}
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-xs">
                Muéstrale el QR a tus alumnos o comparte el enlace directo para que se unan a tu
                equipo.
              </p>

              <div className="w-full mt-4 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant={isCopied ? "default" : "glass"}
                  className={`w-full gap-2 transition-all duration-300 ${
                    isCopied
                      ? "bg-success hover:bg-success text-white border-success/50"
                      : "hover:border-primary/50"
                  }`}
                  onClick={handleShareLink}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>¡Enlace copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-primary-glow" />
                      <span>Copiar enlace de registro</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Save / Cancel Bar when editing */}
        {!edition && (
          <div className="lg:col-span-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="hero"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={handleSaveUser}
              disabled={isLoading}
            >
              <CheckCircle2 className="h-4 w-4" /> Guardar cambios
            </Button>
          </div>
        )}
      </div>
      {isLoading && <SpinnerOverlay label={"Guardando..."} />}
    </AppShell>
  );
}
