import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Hash,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { isAdminUser } from "@/utils/admin";
import { notify } from "@/components/NotificationCenter";
import {
  createPayment,
  getPaymentById,
  getPayments,
  updatePayment,
} from "@/services/payment.service";
import {
  CURRENCY_OPTIONS,
  currencyLabelToCode,
  formatMethodLabel,
  methodLabelToCode,
  PAYMENT_METHOD_OPTIONS,
  PaymentCurrencyCode,
  PaymentDto,
  PaymentMethodCode,
  PaymentStatusCode,
} from "@/types/payment";

export const Route = createFileRoute("/payments")({
  beforeLoad: () => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Pagos — PyrosFit" },
      { name: "description", content: "Registro, consulta y gestión de pagos en PyrosFit." },
    ],
  }),
  component: PaymentsPage,
});

type SortField = "paymentDate" | "amount" | "status" | "id";
type SortOrder = "desc" | "asc";
type ManagementTab = "all" | "mine";

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "aprobado") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Aprobado
      </Badge>
    );
  }
  if (s === "rechazado") {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
        <XCircle className="h-3 w-3" />
        Rechazado
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1">
      <Clock className="h-3 w-3" />
      Pendiente
    </Badge>
  );
}

function formatAmount(amount: number, currency: string) {
  const formatted = Number(amount || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency || ""}`.trim();
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function PaymentsPage() {
  const user = useAuthStore((state) => state.user);
  const currentUserId = Number(user?.id || 0);
  const isAdmin = isAdminUser(user);

  const [activeTab, setActiveTab] = useState<ManagementTab>(isAdmin ? "all" : "mine");
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("paymentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Direct ID lookup result
  const [searchedPayment, setSearchedPayment] = useState<PaymentDto | null>(null);
  const [isSearchingById, setIsSearchingById] = useState(false);

  // Detail modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentDto | null>(null);

  // Create payment modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState<PaymentCurrencyCode>(2);
  const [newMethod, setNewMethod] = useState<PaymentMethodCode>(3);
  const [newPaymentDate, setNewPaymentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [newReference, setNewReference] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Confirm / Reject status dialog
  const [statusActionTarget, setStatusActionTarget] = useState<{
    payment: PaymentDto;
    nextStatus: PaymentStatusCode;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const effectiveUserId =
        !isAdmin || activeTab === "mine"
          ? currentUserId
          : userIdFilter.trim()
            ? Number(userIdFilter.trim())
            : undefined;

      const result = await getPayments({
        userId: effectiveUserId && effectiveUserId > 0 ? effectiveUserId : undefined,
        currency: currencyFilter !== "all" ? currencyFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        from: fromDate ? new Date(`${fromDate}T00:00:00Z`).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59Z`).toISOString() : undefined,
        page,
        pageSize,
      });

      setPayments(result.items);
      setTotalCount(result.totalCount);
    } catch (error: any) {
      console.error("Error cargando pagos:", error);
      notify.error(
        "Error al cargar pagos",
        error.response?.data?.message || "No se pudieron obtener los pagos."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    isAdmin,
    activeTab,
    currentUserId,
    userIdFilter,
    currencyFilter,
    statusFilter,
    fromDate,
    toDate,
    page,
    pageSize,
  ]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleSearchById = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = searchQuery.trim().replace(/^#/, "");
    if (!cleaned || !/^\d+$/.test(cleaned)) {
      setSearchedPayment(null);
      return;
    }

    const idNum = Number(cleaned);
    setIsSearchingById(true);
    try {
      const payment = await getPaymentById(idNum);
      if (!isAdmin && payment.userId !== currentUserId) {
        notify.error("Acceso restringido", "Este pago pertenece a otro usuario.");
        setSearchedPayment(null);
        return;
      }
      setSearchedPayment(payment);
      setSelectedPayment(payment);
    } catch (error: any) {
      setSearchedPayment(null);
      notify.error(
        "Pago no encontrado",
        error.response?.data?.message || `No se encontró un pago con ID #${idNum}.`
      );
    } finally {
      setIsSearchingById(false);
    }
  };

  const filteredAndSortedPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^#/, "");
    const filtered = q
      ? payments.filter(
          (p) =>
            String(p.id).includes(q) ||
            String(p.userId).includes(q) ||
            (p.reference || "").toLowerCase().includes(q) ||
            (p.notes || "").toLowerCase().includes(q) ||
            (p.paymentMethod || "").toLowerCase().includes(q) ||
            (p.currency || "").toLowerCase().includes(q)
        )
      : payments;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "amount") {
        cmp = Number(a.amount) - Number(b.amount);
      } else if (sortField === "status") {
        cmp = (a.status || "").localeCompare(b.status || "");
      } else if (sortField === "id") {
        cmp = a.id - b.id;
      } else {
        cmp = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [payments, searchQuery, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const stats = useMemo(() => {
    const pending = payments.filter((p) => p.status.toLowerCase() === "pendiente").length;
    const approved = payments.filter((p) => p.status.toLowerCase() === "aprobado").length;
    const rejected = payments.filter((p) => p.status.toLowerCase() === "rechazado").length;
    return { pending, approved, rejected };
  }, [payments]);

  const activeFiltersCount = [
    currencyFilter !== "all",
    statusFilter !== "all",
    Boolean(fromDate),
    Boolean(toDate),
    Boolean(userIdFilter),
  ].filter(Boolean).length;

  const handleMethodChange = (val: string) => {
    const code = Number(val) as PaymentMethodCode;
    setNewMethod(code);
    if (code === 2) setNewCurrency(1); // Pago Móvil -> VES
    else if (code === 3 || code === 6) setNewCurrency(2); // Zelle / PayPal -> USD
    else if (code === 4) setNewCurrency(3); // Binance Pay -> USDT
    else if (code === 1 || code === 5) {
      if (newCurrency === 3) setNewCurrency(2); // Transferencia / Efectivo no usan USDT
    }
  };

  const handleCurrencyChange = (val: string) => {
    const code = Number(val) as PaymentCurrencyCode;
    setNewCurrency(code);
    if (code === 3 && newMethod !== 4 && newMethod !== 99) {
      setNewMethod(4); // USDT solo permite BinancePay u Otro
    } else if (code !== 1 && newMethod === 2) {
      setNewMethod(1); // Pago Móvil solo es válido en VES
    } else if (code !== 3 && newMethod === 4) {
      setNewMethod(1);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(newAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      notify.error("Monto inválido", "El monto del pago debe ser mayor a 0.");
      return;
    }

    if (newMethod !== 5 && !newReference.trim()) {
      notify.error(
        "Referencia requerida",
        "Ingresa el número de referencia bancaria o hash de la transacción."
      );
      return;
    }

    if ((newCurrency === 3 || newMethod === 4) && newReference.trim().length < 18) {
      notify.error(
        "Referencia muy corta",
        "Para USDT / Binance Pay la referencia o hash debe tener al menos 18 caracteres."
      );
      return;
    }

    if (newMethod === 2 && newCurrency !== 1) {
      notify.error("Moneda incompatible", "Pago Móvil solo es válido en Bolívares (VES).");
      return;
    }

    if (newCurrency === 3 && newMethod !== 4 && newMethod !== 99) {
      notify.error(
        "Método incompatible",
        "Los pagos en USDT solo aceptan Binance Pay u Otro como método."
      );
      return;
    }

    setIsCreating(true);
    try {
      const isoDate = newPaymentDate
        ? new Date(`${newPaymentDate}T12:00:00Z`).toISOString()
        : new Date().toISOString();

      await createPayment({
        userId: currentUserId,
        amount: parsedAmount,
        currency: newCurrency,
        paymentMethod: newMethod,
        paymentDate: isoDate,
        reference: newReference.trim() || "EFECTIVO",
        status: 1,
        notes: newNotes.trim() || null,
      });

      notify.success(
        "Pago registrado",
        "Tu pago quedó en estado Pendiente hasta ser confirmado."
      );
      setIsCreateOpen(false);
      setNewAmount("");
      setNewReference("");
      setNewNotes("");
      setPage(1);
      await loadPayments();
    } catch (error: any) {
      console.error("Error registrando pago:", error);
      notify.error(
        "No se pudo registrar",
        error?.message ||
          error.response?.data?.message ||
          "Verifica los datos e intenta nuevamente."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusActionTarget || !isAdmin) return;
    const { payment, nextStatus } = statusActionTarget;

    setIsUpdatingStatus(true);
    try {
      const updated = await updatePayment(payment.id, {
        userId: payment.userId,
        amount: payment.amount,
        currency: currencyLabelToCode(payment.currency),
        paymentMethod: methodLabelToCode(payment.paymentMethod),
        paymentDate: payment.paymentDate,
        reference: payment.reference ?? null,
        status: nextStatus,
        notes: actionNotes.trim() || payment.notes || null,
      });

      setPayments((prev) => prev.map((p) => (p.id === payment.id ? updated : p)));
      if (selectedPayment?.id === payment.id) {
        setSelectedPayment(updated);
      }
      if (searchedPayment?.id === payment.id) {
        setSearchedPayment(updated);
      }

      notify.success(
        nextStatus === 2 ? "Pago aprobado" : "Pago rechazado",
        `El pago #${payment.id} pasó a estado ${nextStatus === 2 ? "Aprobado" : "Rechazado"}.`
      );
      setStatusActionTarget(null);
      setActionNotes("");
    } catch (error: any) {
      console.error("Error actualizando estado:", error);
      notify.error(
        "Error al actualizar",
        error.response?.data?.message || "No se pudo actualizar el estado del pago."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isNumericQuery = /^\d+$/.test(searchQuery.trim().replace(/^#/, ""));

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 pb-8">
        {/* Mobile-First Top Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/perfil/$userId"
              params={{ userId: String(currentUserId) }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a mi perfil</span>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPayments}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 cursor-pointer text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">Actualizar</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground leading-none">
                  {isAdmin ? "Gestión de Pagos" : "Mis Pagos"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isAdmin
                    ? "Administra, confirma y consulta pagos."
                    : "Tu historial de pagos y nuevos comprobantes."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="hero"
              onClick={() => setIsCreateOpen(true)}
              className="w-full sm:w-auto h-11 sm:h-10 gap-2 shadow-glow cursor-pointer font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Pago</span>
            </Button>
          </div>
        </div>

        {/* Admin Summary KPIs & Segmented Tabs */}
        {isAdmin && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <Card className="p-3.5 sm:p-4 bg-card/80 border-border">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  Total registros
                </p>
                <p className="font-display text-xl sm:text-2xl text-foreground mt-1">
                  {totalCount}
                </p>
              </Card>
              <Card className="p-3.5 sm:p-4 bg-card/80 border-amber-500/30">
                <p className="text-[10px] sm:text-xs text-amber-400 uppercase tracking-wider">
                  Pendientes
                </p>
                <p className="font-display text-xl sm:text-2xl text-amber-400 mt-1">
                  {stats.pending}
                </p>
              </Card>
              <Card className="p-3.5 sm:p-4 bg-card/80 border-emerald-500/30">
                <p className="text-[10px] sm:text-xs text-emerald-400 uppercase tracking-wider">
                  Aprobados
                </p>
                <p className="font-display text-xl sm:text-2xl text-emerald-400 mt-1">
                  {stats.approved}
                </p>
              </Card>
              <Card className="p-3.5 sm:p-4 bg-card/80 border-destructive/30">
                <p className="text-[10px] sm:text-xs text-destructive uppercase tracking-wider">
                  Rechazados
                </p>
                <p className="font-display text-xl sm:text-2xl text-destructive mt-1">
                  {stats.rejected}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-2 sm:inline-flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border">
              <Button
                type="button"
                variant={activeTab === "all" ? "hero" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("all");
                  setPage(1);
                }}
                className="cursor-pointer h-9 text-xs sm:text-sm"
              >
                Gestión (Todos)
              </Button>
              <Button
                type="button"
                variant={activeTab === "mine" ? "hero" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("mine");
                  setPage(1);
                }}
                className="cursor-pointer h-9 text-xs sm:text-sm"
              >
                Mis Pagos
              </Button>
            </div>
          </div>
        )}

        {/* Mobile-First Search & Collapsible Filters */}
        <Card className="p-3.5 sm:p-4 bg-card/80 border-border space-y-3">
          <div className="flex gap-2">
            <form onSubmit={handleSearchById} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar #ID, referencia o nota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input/60 pl-9 h-10 text-sm"
                />
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {isNumericQuery && (
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSearchingById}
                  className="shrink-0 h-10 px-3 gap-1.5 cursor-pointer"
                >
                  <Hash className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {isSearchingById ? "Buscando..." : "Buscar ID"}
                  </span>
                </Button>
              )}
            </form>

            <Button
              type="button"
              variant={showMobileFilters || activeFiltersCount > 0 ? "secondary" : "outline"}
              onClick={() => setShowMobileFilters((v) => !v)}
              className="md:hidden h-10 px-3 gap-1.5 shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-xs">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          <div
            className={`${
              showMobileFilters ? "grid" : "hidden md:grid"
            } grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 pt-1`}
          >
            <Select
              value={currencyFilter}
              onValueChange={(v) => {
                setCurrencyFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[130px] h-10 md:h-9 bg-input/60 text-xs">
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas monedas</SelectItem>
                <SelectItem value="VES">VES</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[140px] h-10 md:h-9 bg-input/60 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortField}:${sortOrder}`}
              onValueChange={(v) => {
                const [f, o] = v.split(":") as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
              }}
            >
              <SelectTrigger className="w-full lg:w-[180px] h-10 md:h-9 bg-input/60 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paymentDate:desc">Fecha (más reciente)</SelectItem>
                <SelectItem value="paymentDate:asc">Fecha (más antigua)</SelectItem>
                <SelectItem value="amount:desc">Monto (mayor a menor)</SelectItem>
                <SelectItem value="amount:asc">Monto (menor a mayor)</SelectItem>
                <SelectItem value="status:asc">Estado (A-Z)</SelectItem>
                <SelectItem value="id:desc">ID (mayor a menor)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />
              <Input
                type="date"
                aria-label="Desde"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="flex-1 lg:w-36 h-10 md:h-9 text-xs bg-input/60"
              />
              <span className="text-xs text-muted-foreground">a</span>
              <Input
                type="date"
                aria-label="Hasta"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="flex-1 lg:w-36 h-10 md:h-9 text-xs bg-input/60"
              />
            </div>

            {isAdmin && activeTab === "all" && (
              <Input
                type="number"
                placeholder="Filtrar UserId..."
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full lg:w-32 h-10 md:h-9 text-xs bg-input/60"
              />
            )}

            {(activeFiltersCount > 0 || searchQuery) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCurrencyFilter("all");
                  setStatusFilter("all");
                  setFromDate("");
                  setToDate("");
                  setUserIdFilter("");
                  setSearchedPayment(null);
                  setPage(1);
                }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer justify-start sm:justify-center"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </Card>

        {/* Payments Content */}
        {isLoading ? (
          <Card className="p-10 text-center text-sm text-muted-foreground bg-card/80">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Cargando historial de pagos...
          </Card>
        ) : filteredAndSortedPayments.length === 0 ? (
          <Card className="p-8 sm:p-10 text-center space-y-3 bg-card/80">
            <Receipt className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No hay pagos para mostrar</p>
              <p className="text-xs text-muted-foreground">
                Registra un nuevo pago o ajusta los filtros de búsqueda.
              </p>
            </div>
            <Button
              type="button"
              variant="hero"
              onClick={() => setIsCreateOpen(true)}
              className="w-full sm:w-auto gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar primer pago</span>
            </Button>
          </Card>
        ) : isAdmin && activeTab === "all" ? (
          <>
            {/* Mobile-First Touch Cards for Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
              {filteredAndSortedPayments.map((p) => {
                const isPending = p.status.toLowerCase() === "pendiente";
                return (
                  <Card key={p.id} className="p-4 bg-card/80 border-border space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-xl text-foreground">
                          {formatAmount(p.amount, p.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          #{p.id} • User #{p.userId} • {formatMethodLabel(p.paymentMethod)}
                        </p>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(p.paymentDate)}
                      </span>
                      <span className="font-mono text-[11px]">Ref: {p.reference || "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {isPending && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActionNotes("");
                              setStatusActionTarget({ payment: p, nextStatus: 2 });
                            }}
                            className="flex-1 h-9 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/15 cursor-pointer"
                          >
                            Aprobar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActionNotes("");
                              setStatusActionTarget({ payment: p, nextStatus: 3 });
                            }}
                            className="flex-1 h-9 text-xs text-destructive border-destructive/40 hover:bg-destructive/15 cursor-pointer"
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedPayment(p)}
                        className={`${isPending ? "px-2.5" : "w-full"} h-9 text-xs gap-1 cursor-pointer`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detalle</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Desktop Table for Coach/Admin */}
            <Card className="hidden lg:block bg-card/80 border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Referencia</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAndSortedPayments.map((p) => {
                      const isPending = p.status.toLowerCase() === "pendiente";
                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            #{p.id}
                          </td>
                          <td className="px-4 py-3 font-medium">User #{p.userId}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {formatAmount(p.amount, p.currency)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatMethodLabel(p.paymentMethod)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{p.reference || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDate(p.paymentDate)}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setActionNotes("");
                                      setStatusActionTarget({ payment: p, nextStatus: 2 });
                                    }}
                                    className="h-7 px-2 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/15 cursor-pointer"
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setActionNotes("");
                                      setStatusActionTarget({ payment: p, nextStatus: 3 });
                                    }}
                                    className="h-7 px-2 text-xs text-destructive border-destructive/40 hover:bg-destructive/15 cursor-pointer"
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              )}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedPayment(p)}
                                className="h-7 w-7 cursor-pointer"
                                title="Ver detalle"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          /* Informal, Friendly Card History for Clients (and "Mis Pagos") */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAndSortedPayments.map((p) => (
              <Card
                key={p.id}
                onClick={() => setSelectedPayment(p)}
                className="p-4 bg-card/80 border-border hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl text-foreground">
                      {formatAmount(p.amount, p.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                      <span>{formatMethodLabel(p.paymentMethod)}</span>
                      <span>•</span>
                      <span className="font-mono">#{p.id}</span>
                    </p>
                  </div>
                  {getStatusBadge(p.status)}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(p.paymentDate)}
                  </span>
                  {p.reference && (
                    <span className="font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded">
                      Ref: {p.reference}
                    </span>
                  )}
                </div>

                {p.notes && (
                  <p className="text-xs text-muted-foreground/90 italic line-clamp-2">
                    “{p.notes}”
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Mobile-First Pagination */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs text-muted-foreground">
            <span>
              Pág. <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalCount})
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[95px] h-9 text-xs bg-input/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / pág</SelectItem>
                <SelectItem value="20">20 / pág</SelectItem>
                <SelectItem value="50">50 / pág</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:flex w-full sm:w-auto items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-10 sm:h-9 gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-10 sm:h-9 gap-1 cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Register Payment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-border bg-card w-[calc(100%-1.5rem)] max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <span>Registrar nuevo pago</span>
            </DialogTitle>
            <DialogDescription>
              El pago se registrará inicialmente como <strong>Pendiente</strong> hasta que sea
              confirmado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Método *</Label>
                <Select value={String(newMethod)} onValueChange={handleMethodChange}>
                  <SelectTrigger id="paymentMethod" className="bg-input/60 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency">Moneda *</Label>
                <Select
                  value={String(newCurrency)}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger id="currency" className="bg-input/60 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={String(c.value)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  className="bg-input/60 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentDate">Fecha del pago *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  required
                  className="bg-input/60 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference">
                Referencia / Hash {newMethod === 5 ? "(opcional en efectivo)" : "*"}
              </Label>
              <Input
                id="reference"
                type="text"
                placeholder="Ej. 00123456 o TxID"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                required={newMethod !== 5}
                className="bg-input/60 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Ej. Mensualidad de noviembre..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-input/60 resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
                className="h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="hero"
                disabled={isCreating}
                className="h-10 cursor-pointer"
              >
                {isCreating ? "Registrando..." : "Registrar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Modal */}
      <Dialog
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        <DialogContent className="border-border bg-card w-[calc(100%-1.5rem)] max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                  <span>Detalle del Pago #{selectedPayment.id}</span>
                  {getStatusBadge(selectedPayment.status)}
                </DialogTitle>
                <DialogDescription>
                  Registrado el {formatDate(selectedPayment.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                  <span className="text-muted-foreground">Monto</span>
                  <span className="font-display text-xl text-foreground">
                    {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Método</p>
                    <p className="font-medium mt-0.5">
                      {formatMethodLabel(selectedPayment.paymentMethod)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Fecha de pago</p>
                    <p className="font-medium mt-0.5">{formatDate(selectedPayment.paymentDate)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Referencia</p>
                    <p className="font-mono mt-0.5">{selectedPayment.reference || "—"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Usuario</p>
                    <p className="font-medium mt-0.5">#{selectedPayment.userId}</p>
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="p-2.5 rounded-lg bg-muted/20 text-xs">
                    <p className="text-muted-foreground mb-1">Notas</p>
                    <p>{selectedPayment.notes}</p>
                  </div>
                )}

                {selectedPayment.receiptUrl && (
                  <a
                    href={selectedPayment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Ver comprobante adjunto
                  </a>
                )}
              </div>

              {isAdmin && selectedPayment.status.toLowerCase() === "pendiente" && (
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setActionNotes("");
                      setStatusActionTarget({ payment: selectedPayment, nextStatus: 3 });
                    }}
                    className="h-10 cursor-pointer"
                  >
                    Rechazar
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={() => {
                      setActionNotes("");
                      setStatusActionTarget({ payment: selectedPayment, nextStatus: 2 });
                    }}
                    className="h-10 cursor-pointer"
                  >
                    Aprobar pago
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Approve/Reject Dialog */}
      <AlertDialog
        open={Boolean(statusActionTarget)}
        onOpenChange={(open) => !open && setStatusActionTarget(null)}
      >
        <AlertDialogContent className="border-border bg-card w-[calc(100%-1.5rem)] max-w-md rounded-2xl">
          {statusActionTarget && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {statusActionTarget.nextStatus === 2
                    ? `¿Confirmar aprobación del pago #${statusActionTarget.payment.id}?`
                    : `¿Rechazar el pago #${statusActionTarget.payment.id}?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Monto:{" "}
                  <strong>
                    {formatAmount(
                      statusActionTarget.payment.amount,
                      statusActionTarget.payment.currency
                    )}
                  </strong>{" "}
                  • Ref: <strong>{statusActionTarget.payment.reference || "—"}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="actionNotes" className="text-xs">
                  Nota de confirmación / motivo (opcional)
                </Label>
                <Textarea
                  id="actionNotes"
                  rows={2}
                  placeholder="Agregar observación..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="bg-input/60 resize-none"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdatingStatus} className="h-10">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmStatusUpdate}
                  disabled={isUpdatingStatus}
                  className={
                    statusActionTarget.nextStatus === 2
                      ? "h-10 bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      : "h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  }
                >
                  {isUpdatingStatus
                    ? "Actualizando..."
                    : statusActionTarget.nextStatus === 2
                      ? "Sí, aprobar"
                      : "Sí, rechazar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
