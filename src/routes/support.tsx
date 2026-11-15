import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Lock,
  ArrowLeft,
  RefreshCw,
  LogIn,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Bug,
  Send,
  Smartphone,
  Tag,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { login } from "@/services/auth.service";
import { deleteUser, getUser } from "@/services/user.service";
import {
  createTicket,
  CreateTicketPayload,
  getMyTickets,
  TicketDto,
} from "@/services/ticket.service";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/components/NotificationCenter";
import { SpinnerOverlay } from "@/components/Spinner";
import { PyrosLogo } from "@/components/brand/PyrosLogo";
import { isUserDeactivated, markAccountAsDeleted } from "@/utils/deletedAccount";

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>): { mode?: "ticket" | "delete" } => ({
    mode: search.mode === "ticket" || search.mode === "delete" ? search.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Soporte y Gestión de Cuenta — PyrosFit" },
      {
        name: "description",
        content:
          "Inicia sesión para enviar un ticket de bug o sugerencia, o solicitar la baja de tu cuenta en PyrosFit.",
      },
    ],
  }),
  component: AccountPortalPage,
});

type PortalStep = "credentials" | "action-select" | "confirm" | "deleted" | "ticket" | "ticket-sent";
type TicketPlatform = CreateTicketPayload["platform"];

function AccountPortalPage() {
  const { mode } = Route.useSearch();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const loggedInUserId = Number(authUser?.id);
  const hasLoggedInSession = Number.isFinite(loggedInUserId) && loggedInUserId > 0;
  const loggedInDisplayName =
    (authUser as { userName?: string; lastName?: string } | null)?.userName ||
    [authUser?.firstName, (authUser as { lastName?: string } | null)?.lastName]
      .filter(Boolean)
      .join(" ") ||
    authUser?.email ||
    "Usuario";

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<PortalStep>(
    mode === "ticket" && hasLoggedInSession ? "ticket" : "credentials"
  );
  const [verifiedUserName, setVerifiedUserName] = useState(
    mode === "ticket" && hasLoggedInSession ? loggedInDisplayName : ""
  );
  const [verifiedEmail, setVerifiedEmail] = useState(
    mode === "ticket" && hasLoggedInSession ? authUser?.email || "" : ""
  );
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(
    mode === "ticket" && hasLoggedInSession ? loggedInUserId : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Ticket form state
  const [bugName, setBugName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<TicketPlatform>("android");
  const [appVersion, setAppVersion] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [myTickets, setMyTickets] = useState<TicketDto[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    if (mode !== "ticket" || !hasLoggedInSession) return;

    setResolvedUserId(loggedInUserId);
    setVerifiedUserName(loggedInDisplayName);
    setVerifiedEmail(authUser?.email || "");
    setStep("ticket");

    let active = true;
    setIsLoadingTickets(true);
    getMyTickets(loggedInUserId)
      .then((tickets) => {
        if (active) setMyTickets(tickets);
      })
      .catch(() => {
        // Silencioso si falla la carga previa del historial
      })
      .finally(() => {
        if (active) setIsLoadingTickets(false);
      });

    return () => {
      active = false;
    };
  }, [mode, hasLoggedInSession, loggedInUserId, loggedInDisplayName, authUser?.email]);

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUserName = userName.trim();
    if (!trimmedUserName) {
      notify.error("Error", "El usuario es obligatorio");
      return;
    }

    if (!password.trim()) {
      notify.error("Error", "La contraseña es obligatoria");
      return;
    }

    setIsLoading(true);

    try {
      const data = await login({ userName: trimmedUserName, password });
      const userId = Number(data?.id);

      if (!userId || isNaN(userId)) {
        notify.error("Error", "No se pudo identificar la cuenta del usuario.");
        return;
      }

      if (isUserDeactivated(data, null, { id: userId, userName: trimmedUserName })) {
        notify.error("Cuenta dada de baja", "Esta cuenta ya fue eliminada y no puede ingresar.");
        return;
      }

      const userData = await getUser(userId).catch(() => null);

      if (isUserDeactivated(data, userData, { id: userId, userName: trimmedUserName })) {
        notify.error("Cuenta dada de baja", "Esta cuenta ya fue eliminada y no puede ingresar.");
        return;
      }

      setResolvedUserId(userId);
      setVerifiedUserName(userData?.userName || trimmedUserName);
      setVerifiedEmail(userData?.email || "");
      setStep("action-select");
      notify.success("Cuenta verificada", "Selecciona la acción que deseas realizar.");
    } catch (error: any) {
      console.error("Error al verificar las credenciales:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Credenciales inválidas. Verifica tu usuario y contraseña.";
      notify.error("Error", apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!resolvedUserId) return;

    setIsConfirmDialogOpen(false);
    setIsDeleting(true);

    try {
      await deleteUser(resolvedUserId);

      markAccountAsDeleted({
        id: resolvedUserId,
        userName: verifiedUserName,
        email: verifiedEmail,
      });

      if (Number(authUser?.id) === resolvedUserId) {
        logout();
      }

      setStep("deleted");
      notify.success(
        "Eliminación confirmada",
        "Tu cuenta y tus datos han sido dados de baja correctamente."
      );
    } catch (error: any) {
      console.error("Error al eliminar los datos del usuario:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "No se pudo completar la eliminación. Intenta de nuevo más tarde.";
      notify.error("Error", apiMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetTicketForm = () => {
    setBugName("");
    setDescription("");
    setPlatform("android");
    setAppVersion("");
    setDeviceModel("");
  };

  const handleOpenTickets = async () => {
    setStep("ticket");
    if (!resolvedUserId) return;
    setIsLoadingTickets(true);
    try {
      const tickets = await getMyTickets(resolvedUserId);
      setMyTickets(tickets);
    } catch {
      // Si falla la carga previa del historial, no bloqueamos el envío de nuevos tickets
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedBugName = bugName.trim();
    const trimmedDescription = description.trim();

    if (trimmedBugName.length < 3 || trimmedBugName.length > 150) {
      notify.error(
        "Nombre inválido",
        "El nombre del bug o sugerencia debe tener entre 3 y 150 caracteres."
      );
      return;
    }

    if (trimmedDescription.length < 10) {
      notify.error(
        "Descripción muy corta",
        "La descripción debe tener al menos 10 caracteres."
      );
      return;
    }

    if (!resolvedUserId) {
      notify.error("Sesión requerida", "Debes validar tu cuenta antes de enviar un ticket.");
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const created = await createTicket({
        userId: resolvedUserId,
        bugName: trimmedBugName,
        description: trimmedDescription,
        platform,
        appVersion,
        deviceModel,
      });

      if (created) {
        setMyTickets((prev) => [created, ...prev]);
      }

      setStep("ticket-sent");
      notify.success("Ticket enviado", "Tu reporte o sugerencia fue enviado correctamente.");
    } catch (error: any) {
      console.error("Error al enviar ticket:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "No se pudo enviar el ticket. Verifica tu sesión e intenta nuevamente.";
      notify.error("Error", apiMessage);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleReset = () => {
    setStep("credentials");
    setPassword("");
    setVerifiedUserName("");
    setVerifiedEmail("");
    setResolvedUserId(null);
    setMyTickets([]);
    resetTicketForm();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
    >
      {/* Background glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-primary opacity-15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <Link to="/" className="flex flex-col items-center gap-3 group">
            <PyrosLogo
              variant="icon"
              size="xl"
              iconClassName="h-16 w-16 group-hover:scale-105 transition-transform"
            />
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-foreground">
                PyrosFit
              </h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow font-medium mt-1">
                Soporte y Gestión de Cuenta
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <Card className="rounded-2xl border border-border bg-card/85 backdrop-blur-md p-6 sm:p-8 shadow-elevated">
          {step === "credentials" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  Valida tu cuenta
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Ingresa tu usuario y contraseña para enviar un ticket de bug o sugerencia, o
                  gestionar la baja de tu cuenta.
                </p>
              </div>

              <form onSubmit={handleVerifyCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="userName"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Usuario
                  </Label>
                  <div className="relative">
                    <Input
                      id="userName"
                      name="userName"
                      type="text"
                      placeholder="usuario"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      autoFocus
                      autoComplete="username"
                      className="bg-input/60 pl-10 focus:border-primary"
                    />
                    <User className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="bg-input/60 pl-10 focus:border-primary"
                    />
                    <Lock className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full gap-2 font-medium cursor-pointer shadow-glow py-5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Iniciar sesión y continuar</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-border/40">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          )}

          {step === "action-select" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.2)]">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-2xl text-foreground">¿Qué deseas hacer?</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Sesión verificada como{" "}
                  <strong className="text-foreground">{verifiedUserName}</strong>
                  {verifiedEmail ? (
                    <>
                      {" "}
                      (<span className="text-foreground/80">{verifiedEmail}</span>)
                    </>
                  ) : null}
                </p>
              </div>

              <div className="w-full space-y-3 pt-1">
                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  onClick={handleOpenTickets}
                  className="w-full gap-2 font-semibold cursor-pointer shadow-glow py-5"
                >
                  <Bug className="h-4 w-4" />
                  <span>Enviar Ticket (Bug o Sugerencia)</span>
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => setStep("confirm")}
                  className="w-full gap-2 font-semibold cursor-pointer py-5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Dar de baja mi cuenta</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleReset}
                  className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Usar otra cuenta</span>
                </Button>
              </div>
            </div>
          )}

          {step === "ticket" && (
            <div className="space-y-5 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-1">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
                  <Bug className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-2xl text-foreground">Enviar Ticket</h2>
                <p className="text-xs text-muted-foreground">
                  Reporta un bug o envía una sugerencia como{" "}
                  <strong className="text-foreground">{verifiedUserName}</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bugName"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Nombre del bug o sugerencia *
                  </Label>
                  <Input
                    id="bugName"
                    name="bugName"
                    type="text"
                    minLength={3}
                    maxLength={150}
                    placeholder="Ej. Error al guardar rutina o sugerencia de filtro"
                    value={bugName}
                    onChange={(e) => setBugName(e.target.value)}
                    required
                    className="bg-input/60 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="description"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Descripción *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    minLength={10}
                    placeholder="Describe detalladamente lo ocurrido o la mejora que te gustaría ver (mín. 10 caracteres)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-input/60 focus:border-primary resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="platform"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Plataforma *
                  </Label>
                  <Select
                    value={platform}
                    onValueChange={(value) => setPlatform(value as TicketPlatform)}
                  >
                    <SelectTrigger id="platform" className="bg-input/60 focus:border-primary">
                      <SelectValue placeholder="Selecciona la plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="android">Android</SelectItem>
                      <SelectItem value="iphone">iPhone</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="todas">Todas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="appVersion"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      Versión
                    </Label>
                    <div className="relative">
                      <Input
                        id="appVersion"
                        name="appVersion"
                        type="text"
                        maxLength={50}
                        placeholder="Ej. 1.2.0"
                        value={appVersion}
                        onChange={(e) => setAppVersion(e.target.value)}
                        className="bg-input/60 pl-9 focus:border-primary"
                      />
                      <Tag className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="deviceModel"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      Modelo del dispositivo
                    </Label>
                    <div className="relative">
                      <Input
                        id="deviceModel"
                        name="deviceModel"
                        type="text"
                        maxLength={100}
                        placeholder="Ej. iPhone 15 / Chrome"
                        value={deviceModel}
                        onChange={(e) => setDeviceModel(e.target.value)}
                        className="bg-input/60 pl-9 focus:border-primary"
                      />
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmittingTicket}
                    className="w-full gap-2 font-medium cursor-pointer shadow-glow py-5"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Enviando ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Enviar Ticket</span>
                      </>
                    )}
                  </Button>

                  {mode === "ticket" && hasLoggedInSession ? (
                    <Link
                      to="/perfil/$userId"
                      params={{ userId: String(loggedInUserId) }}
                      className="w-full block"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled={isSubmittingTicket}
                        className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver a mi perfil</span>
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setStep("action-select")}
                      disabled={isSubmittingTicket}
                      className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Volver a opciones</span>
                    </Button>
                  )}
                </div>
              </form>

              {(isLoadingTickets || myTickets.length > 0) && (
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">
                      Mis tickets recientes
                    </span>
                    {isLoadingTickets && <RefreshCw className="h-3 w-3 animate-spin" />}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {myTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-border/60 bg-background/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">{t.bugName}</span>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              t.isAddressed
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {t.isAddressed ? "Atendido" : "Pendiente"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="uppercase">{t.platform}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "ticket-sent" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span>Ticket Registrado</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                ¡Gracias por tu reporte!
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Tu ticket fue enviado correctamente con la cuenta{" "}
                <strong className="text-foreground">{verifiedUserName}</strong>. Nuestro equipo lo
                revisará pronto.
              </p>

              <div className="w-full space-y-2.5 pt-2">
                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  onClick={() => {
                    resetTicketForm();
                    setStep("ticket");
                  }}
                  className="w-full shadow-glow font-medium cursor-pointer gap-2"
                >
                  <Bug className="h-4 w-4" />
                  <span>Enviar otro ticket</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setStep("action-select")}
                  className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver a opciones</span>
                </Button>

                <Link to="/login" className="w-full block">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Volver al Inicio de Sesión
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-2xl text-foreground">Dar de baja cuenta</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Usuario verificado:{" "}
                  <strong className="text-foreground">{verifiedUserName}</strong>
                  {verifiedEmail ? (
                    <>
                      {" "}
                      (<span className="text-foreground/80">{verifiedEmail}</span>)
                    </>
                  ) : null}
                </p>
              </div>

              <div className="w-full text-left p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-muted-foreground leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-destructive font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Atención: acción permanente</span>
                </div>
                <p>
                  Al dar de baja tu cuenta se eliminará tu perfil, historial de entrenamientos,
                  progreso físico, rachas y demás datos personales asociados en PyrosFit.
                </p>
              </div>

              <div className="w-full space-y-2.5 pt-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={isDeleting}
                  className="w-full gap-2 font-semibold cursor-pointer py-5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Dar de baja y eliminar datos</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setStep("action-select")}
                  disabled={isDeleting}
                  className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver a opciones</span>
                </Button>
              </div>
            </div>
          )}

          {step === "deleted" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span>Eliminación Confirmada</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                Cuenta dada de baja
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Se ha completado la eliminación de los datos asociados a{" "}
                <strong className="text-foreground">{verifiedUserName}</strong>.
              </p>

              <Link to="/login" className="w-full block pt-2">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full shadow-glow font-medium cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} PyrosFit. Todos los derechos reservados.
        </p>
      </div>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>¿Confirmar eliminación de datos?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Si confirmas esta acción, tu cuenta (<strong>{verifiedUserName}</strong>) y todos tus
              datos personales serán eliminados permanentemente. Esta operación no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Confirmar y eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(isLoading || isDeleting || isSubmittingTicket) && (
        <SpinnerOverlay
          label={
            isDeleting
              ? "Eliminando datos..."
              : isSubmittingTicket
                ? "Enviando ticket..."
                : "Verificando cuenta..."
          }
        />
      )}
    </div>
  );
}
