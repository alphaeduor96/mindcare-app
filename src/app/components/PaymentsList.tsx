import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, DollarSign, Filter, Download, Settings } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AddPaymentModal } from "./AddPaymentModal";
import { PaymentDetailModal } from "./PaymentDetailModal";
import { SearchablePatientPicker } from "./SearchablePatientPicker";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";
import { toast } from "sonner";

interface PaymentsListProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string }>;
}

const paymentMethods = {
  card: { label: "Tarjeta", color: "bg-[#4DB6AC] text-white" },
  cash: { label: "Efectivo", color: "bg-[#81C784] text-white" },
  transfer: { label: "Transferencia", color: "bg-[#4DD0E1] text-white" },
  credit: { label: "Saldo a favor", color: "bg-[#9575CD] text-white" },
};

const paymentStatus = {
  paid: { label: "Pagado", color: "bg-[#81C784] text-white" },
  pending_apply: { label: "Pendiente de aplicar", color: "bg-[#FFB74D] text-white" },
  applied: { label: "Aplicado", color: "bg-[#81C784] text-white" },
};

interface PaymentRow {
  id: string;
  monto_centavos: number;
  estado: string;
  proveedor_pago?: string | null;
  cuenta_bancaria_id?: string | null;
  pagado_at?: string | null;
  created_at: string;
  citas?: {
    psicologo_id: string;
    inicia_at: string;
    pacientes?: {
      nombre?: string | null;
      apellido?: string | null;
    } | null;
  } | null;
}

interface AdvancePaymentRow {
  id: string;
  monto_centavos: number;
  pagado_at: string;
  created_at: string;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
}

interface PatientIncomeRow {
  id: string;
  paciente_id: string;
  monto_centavos: number;
  estado: "pendiente_aplicar" | "aplicado" | "cancelado";
  fecha_pago: string;
  referencia?: string | null;
  created_at: string;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
}

interface IncomeApplicationRow {
  id: string;
  ingreso_paciente_id: string | null;
  cita_id: string;
  monto_centavos: number;
  pagado_at?: string | null;
  citas?: {
    inicia_at?: string | null;
    estado?: string | null;
    costo_centavos?: number | null;
  } | null;
}

interface PaymentItem {
  id: string;
  patient: string;
  psychologist: string;
  date: string;
  amount: number;
  amountCents: number;
  appliedCents?: number;
  pendingCents?: number;
  applications?: Array<{
    id: string;
    appointmentId: string;
    amountCents: number;
    date?: string | null;
    appointmentDate?: string | null;
    appointmentStatus?: string | null;
    appointmentCostCents?: number | null;
  }>;
  patientId?: string;
  method: "card" | "cash" | "transfer" | "credit";
  status: "paid" | "pending_apply" | "applied";
  type: "Cita" | "Anticipo" | "Ingreso" | "Ajuste";
  flow: "ingreso" | "ajuste";
  account?: string;
  category?: string;
}

interface BankAccountRow {
  id: string;
  nombre: string;
  banco?: string | null;
  ultimos_4?: string | null;
  moneda: string;
  saldo_actual_centavos?: number | null;
  saldo_inicial_centavos?: number | null;
}

interface CategoryRow {
  id: string;
  psicologo_id: string;
  parent_id?: string | null;
  tipo: "ingreso";
  nombre: string;
  estado: string;
}

interface MovementRow {
  id: string;
  cuenta_bancaria_id: string;
  pago_cita_id?: string | null;
  tipo: "ingreso" | "ajuste";
  monto_centavos: number;
  descripcion?: string | null;
  referencia?: string | null;
  movimiento_at: string;
  created_at: string;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
}

interface PatientBalanceRow {
  paciente_id: string;
  nombre?: string | null;
  apellido?: string | null;
  saldo_centavos: number;
}

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function mapPaymentMethod(provider?: string | null): PaymentItem["method"] {
  const normalized = String(provider || "").toLowerCase();
  if (normalized.includes("saldo")) return "credit";
  if (normalized.includes("card") || normalized.includes("tarjeta") || normalized.includes("stripe")) return "card";
  if (normalized.includes("cash") || normalized.includes("efectivo")) return "cash";
  return "transfer";
}

function mapPayment(row: PaymentRow, psychologistName: string): PaymentItem {
  return {
    id: row.id,
    patient: fullName(row.citas?.pacientes) || "Paciente sin nombre",
    psychologist: psychologistName,
    date: row.pagado_at || row.created_at,
    amount: Math.round(row.monto_centavos / 100),
    amountCents: row.monto_centavos,
    patientId: undefined,
    method: mapPaymentMethod(row.proveedor_pago),
    status: "paid",
    type: "Cita",
    flow: "ingreso",
  };
}

function mapAdvancePayment(row: AdvancePaymentRow, psychologistName: string): PaymentItem {
  return {
    id: row.id,
    patient: fullName(row.pacientes) || "Paciente sin nombre",
    psychologist: psychologistName,
    date: row.pagado_at || row.created_at,
    amount: Math.round(row.monto_centavos / 100),
    amountCents: row.monto_centavos,
    patientId: undefined,
    method: "transfer",
    status: "paid",
    type: "Anticipo",
    flow: "ingreso",
  };
}

function mapMovement(
  row: MovementRow,
  psychologistName: string,
  accounts: BankAccountRow[],
  categories: CategoryRow[]
): PaymentItem {
  const account = accounts.find((item) => item.id === row.cuenta_bancaria_id);
  const category = categories.find((item) => item.id === row.subcategoria_id)
    || categories.find((item) => item.id === row.categoria_id);

  return {
    id: row.id,
    patient: row.descripcion || "Movimiento",
    psychologist: psychologistName,
    date: row.movimiento_at || row.created_at,
    amount: Math.round(row.monto_centavos / 100),
    amountCents: row.monto_centavos,
    patientId: undefined,
    method: "transfer",
    status: "paid",
    type: row.tipo === "ajuste" ? "Ajuste" : row.pago_cita_id ? "Cita" : "Ingreso",
    flow: row.tipo,
    account: account?.nombre,
    category: category?.nombre,
  };
}

function mapPatientIncome(
  row: PatientIncomeRow,
  psychologistName: string,
  applications: IncomeApplicationRow[]
): PaymentItem {
  const rowApplications = applications.filter((application) => application.ingreso_paciente_id === row.id);
  const appliedCents = rowApplications.reduce((total, application) => total + application.monto_centavos, 0);
  const pendingCents = Math.max(0, row.monto_centavos - appliedCents);

  return {
    id: row.id,
    patient: fullName(row.pacientes) || "Paciente sin nombre",
    patientId: row.paciente_id,
    psychologist: psychologistName,
    date: row.fecha_pago || row.created_at,
    amount: Math.round(row.monto_centavos / 100),
    amountCents: row.monto_centavos,
    appliedCents,
    pendingCents,
    applications: rowApplications.map((application) => ({
      id: application.id,
      appointmentId: application.cita_id,
      amountCents: application.monto_centavos,
      date: application.pagado_at,
      appointmentDate: application.citas?.inicia_at,
      appointmentStatus: application.citas?.estado,
      appointmentCostCents: application.citas?.costo_centavos,
    })),
    method: "transfer",
    status: pendingCents > 0 ? "pending_apply" : "applied",
    type: "Ingreso",
    flow: "ingreso",
  };
}

function periodStart(period: string) {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const day = now.getDay() || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 - day);
  }
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function PaymentsList({ currentPsychologistId, psychologists, patients }: PaymentsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentToApply, setPaymentToApply] = useState<PaymentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [balanceSearch, setBalanceSearch] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [patientBalances, setPatientBalances] = useState<PatientBalanceRow[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    nombre: "",
    parent_id: "none",
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const psychologistName =
    psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      setError("");

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          setPayments([]);
          return;
        }

        const since = periodStart(periodFilter);
        const loadBankAccounts = async () => {
          try {
            return await supabaseRest<BankAccountRow[]>(
              `/v_cuentas_bancarias_estado?psicologo_id=eq.${profileId}&estado=eq.activa&select=id,nombre,banco,ultimos_4,moneda,saldo_actual_centavos&order=created_at.asc`
            );
          } catch (accountError: any) {
            if (!String(accountError?.message || "").includes("v_cuentas_bancarias_estado")) {
              throw accountError;
            }

            const fallbackAccounts = await supabaseRest<BankAccountRow[]>(
              `/cuentas_bancarias?psicologo_id=eq.${profileId}&estado=eq.activa&select=id,nombre,banco,ultimos_4,moneda,saldo_inicial_centavos&order=created_at.asc`
            );

            return fallbackAccounts.map((account) => ({
              ...account,
              saldo_actual_centavos: account.saldo_inicial_centavos || 0,
            }));
          }
        };

        const [incomeRows, rows, advances, accounts, balances, categoryRows] = await Promise.all([
          supabaseRest<PatientIncomeRow[]>(
            `/ingresos_paciente?psicologo_id=eq.${profileId}&fecha_pago=gte.${since.toISOString().slice(0, 10)}&select=id,paciente_id,monto_centavos,estado,fecha_pago,referencia,created_at,pacientes(nombre,apellido)&order=fecha_pago.desc,created_at.desc`
          ).catch((incomeError: any) => {
            if (String(incomeError?.message || "").includes("ingresos_paciente")) return [];
            throw incomeError;
          }),
          supabaseRest<PaymentRow[]>(
            `/pagos_cita?created_at=gte.${since.toISOString()}&estado=eq.pagado&select=id,monto_centavos,estado,proveedor_pago,cuenta_bancaria_id,pagado_at,created_at,citas!inner(psicologo_id,inicia_at,pacientes(nombre,apellido))&citas.psicologo_id=eq.${profileId}&order=created_at.desc`
          ),
          supabaseRest<AdvancePaymentRow[]>(
            `/pagos_anticipados_paciente?psicologo_id=eq.${profileId}&pagado_at=gte.${since.toISOString()}&select=id,monto_centavos,pagado_at,created_at,pacientes(nombre,apellido)&order=pagado_at.desc`
          ),
          loadBankAccounts(),
          supabaseRest<PatientBalanceRow[]>(
            `/v_saldos_paciente?psicologo_id=eq.${profileId}&saldo_centavos=gt.0&select=paciente_id,nombre,apellido,saldo_centavos&order=saldo_centavos.desc`
          ),
          supabaseRest<CategoryRow[]>(
            `/categorias_financieras?psicologo_id=eq.${profileId}&estado=eq.activa&tipo=eq.ingreso&select=id,psicologo_id,parent_id,tipo,nombre,estado&order=nombre.asc`
          ).catch((categoryError: any) => {
            if (String(categoryError?.message || "").includes("categorias_financieras")) return [];
            throw categoryError;
          }),
        ]);

        const accountIds = accounts.map((account) => account.id);
        const movements = accountIds.length
          ? await supabaseRest<MovementRow[]>(
              `/movimientos_cuenta_bancaria?cuenta_bancaria_id=in.(${accountIds.join(",")})&tipo=eq.ingreso&movimiento_at=gte.${since.toISOString()}&select=id,cuenta_bancaria_id,pago_cita_id,tipo,monto_centavos,descripcion,referencia,movimiento_at,created_at,categoria_id,subcategoria_id&order=movimiento_at.desc`
            )
          : [];

        if (!active) return;
        const incomeIds = incomeRows.map((income) => income.id);
        const incomeApplications = incomeIds.length
          ? await supabaseRest<IncomeApplicationRow[]>(
              `/pagos_cita?ingreso_paciente_id=in.(${incomeIds.join(",")})&estado=eq.pagado&select=id,ingreso_paciente_id,cita_id,monto_centavos,pagado_at,citas(inicia_at,estado,costo_centavos)`
            ).catch((applicationError: any) => {
              if (String(applicationError?.message || "").includes("ingreso_paciente_id")) return [];
              throw applicationError;
            })
          : [];

        const legacyPayments = [
          ...movements.map((row) => mapMovement(row, psychologistName, accounts, categoryRows)),
          ...rows
            .filter((row) => !row.cuenta_bancaria_id || mapPaymentMethod(row.proveedor_pago) === "credit")
            .map((row) => mapPayment(row, psychologistName)),
          ...advances
            .filter(() => accountIds.length === 0)
            .map((row) => mapAdvancePayment(row, psychologistName)),
        ];
        setPayments(
          (incomeRows.length ? incomeRows.map((row) => mapPatientIncome(row, psychologistName, incomeApplications)) : legacyPayments)
            .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
        );
        setBankAccounts(accounts);
        setCategories(categoryRows);
        setPatientBalances(balances);
      } catch (loadError: any) {
        if (!active) return;
        console.error("Payments load error:", loadError);
        setError(`No se pudieron cargar los pagos desde la base de datos. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, periodFilter, psychologistName, reloadKey]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const methodMatches = methodFilter === "all" || payment.method === methodFilter;
        return methodMatches;
      }),
    [methodFilter, payments]
  );

  const totalPaid = filteredPayments
    .filter((p) => p.flow === "ingreso")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPatientCredit = patientBalances.reduce(
    (sum, balance) => sum + Math.round((balance.saldo_centavos || 0) / 100),
    0
  );
  const filteredPatientBalances = patientBalances.filter((balance) => {
    const normalized = fullName(balance).toLowerCase();
    return normalized.includes(balanceSearch.trim().toLowerCase());
  });

  const profileCategoryParents = categories.filter((category) => !category.parent_id);
  const incomeCategoryParents = profileCategoryParents.filter((category) => category.tipo === "ingreso");

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const profileId = await resolvePsychologistProfileId(currentPsychologistId);
    if (!profileId) {
      toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
      return;
    }

    if (!categoryForm.nombre.trim()) {
      toast.error("Escribe el nombre de la categoría.");
      return;
    }

    setSavingConfig(true);
    try {
      await supabaseRest("/categorias_financieras", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          psicologo_id: profileId,
          parent_id: categoryForm.parent_id === "none" ? null : categoryForm.parent_id,
          tipo: "ingreso",
          nombre: categoryForm.nombre.trim(),
          estado: "activa",
        }),
      });
      setCategoryForm({ nombre: "", parent_id: "none" });
      setReloadKey((key) => key + 1);
      toast.success("Categoría creada.");
    } catch (error: any) {
      console.error("Create category error:", error);
      toast.error(`No se pudo crear la categoría. ${error?.message || ""}`);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Pagos</h1>
          <p className="text-muted-foreground">
            Gestión de ingresos recibidos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Registrar Ingreso
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ingresos</p>
                <p className="text-3xl text-foreground">${totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-[#81C784]/10 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Saldo a favor pacientes</p>
            <p className="text-3xl text-foreground">${totalPatientCredit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar por:</span>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-input-background">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="credit">Saldo a favor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-input-background">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle>Saldos a favor</CardTitle>
                <div className="w-full md:w-80">
                  <SearchablePatientPicker
                    label=""
                    placeholder="Buscar paciente"
                    query={balanceSearch}
                    items={patientBalances.map((balance) => ({
                      id: balance.paciente_id,
                      name: fullName(balance) || "Paciente sin nombre",
                      description: `Saldo a favor $${Math.round(balance.saldo_centavos / 100).toLocaleString()}`,
                    }))}
                    allOptionLabel="Todos los saldos"
                    onQueryChange={setBalanceSearch}
                    onSelect={(patient) => setBalanceSearch(patient?.name || "")}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {patientBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pacientes con saldo a favor disponible.</p>
              ) : filteredPatientBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pacientes que coincidan con la búsqueda.</p>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead className="text-right">Saldo a favor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatientBalances.map((balance) => (
                        <TableRow key={balance.paciente_id}>
                          <TableCell className="text-foreground">
                            {fullName(balance) || "Paciente sin nombre"}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            ${Math.round(balance.saldo_centavos / 100).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Historial de ingresos</CardTitle>
            </CardHeader>
            <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Aplicado</TableHead>
                <TableHead className="text-right">Por aplicar</TableHead>
                <TableHead className="text-center">Método</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    Cargando movimientos...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No hay ingresos registrados con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                const method = paymentMethods[payment.method as keyof typeof paymentMethods];
                const status = paymentStatus[payment.status as keyof typeof paymentStatus];

                return (
                  <TableRow key={payment.id} className="hover:bg-accent/50">
                    <TableCell className="text-muted-foreground">
                      #{payment.id.toString().padStart(4, "0")}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {payment.patient}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.account || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.category || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      ${Math.round((payment.appliedCents || 0) / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      ${Math.round((payment.pendingCents ?? 0) / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={method.color}>{method.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payment.status === "pending_apply" && payment.patientId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPaymentToApply(payment);
                              setIsModalOpen(true);
                            }}
                          >
                            Aplicar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setDetailModalOpen(true);
                          }}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Categorías de ingresos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Depende de</Label>
                  <Select
                    value={categoryForm.parent_id}
                    onValueChange={(value) => setCategoryForm({ ...categoryForm, parent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Categoría principal</SelectItem>
                      {incomeCategoryParents.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Ej. Renta, Nómina, Consulta privada"
                    value={categoryForm.nombre}
                    onChange={(event) => setCategoryForm({ ...categoryForm, nombre: event.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={savingConfig}>
                    Crear categoría
                  </Button>
                </div>
              </form>

              <div className="rounded-md border border-border p-3">
                <p className="font-medium mb-2">Ingresos</p>
                <div className="space-y-2">
                  {incomeCategoryParents.map((category) => (
                    <div key={category.id}>
                      <p className="text-sm text-foreground">{category.nombre}</p>
                      {categories.filter((child) => child.parent_id === category.id).map((child) => (
                        <p key={child.id} className="text-xs text-muted-foreground ml-3">- {child.nombre}</p>
                      ))}
                    </div>
                  ))}
                  {incomeCategoryParents.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay categorías de ingreso.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPaymentToApply(null);
        }}
        patients={patients}
        psychologists={psychologists}
        defaultPsychologist={currentPsychologistId}
        prefilledPayment={paymentToApply ? {
          id: paymentToApply.id,
          patientId: paymentToApply.patientId || "",
          amount: paymentToApply.pendingCents ?? paymentToApply.amountCents,
        } : undefined}
        onPaymentCreated={() => setReloadKey((key) => key + 1)}
      />

      <PaymentDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />
    </div>
  );
}
