import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, DollarSign, Filter, Download } from "lucide-react";
import { Badge } from "./ui/badge";
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
import { AddPaymentModal } from "./AddPaymentModal";
import { PaymentDetailModal } from "./PaymentDetailModal";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

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
};

interface PaymentRow {
  id: string;
  monto_centavos: number;
  estado: string;
  proveedor_pago?: string | null;
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

interface PaymentItem {
  id: string;
  patient: string;
  psychologist: string;
  date: string;
  amount: number;
  method: "card" | "cash" | "transfer" | "credit";
  status: "paid";
  type: "Cita" | "Anticipo";
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
    method: mapPaymentMethod(row.proveedor_pago),
    status: "paid",
    type: "Cita",
  };
}

function mapAdvancePayment(row: AdvancePaymentRow, psychologistName: string): PaymentItem {
  return {
    id: row.id,
    patient: fullName(row.pacientes) || "Paciente sin nombre",
    psychologist: psychologistName,
    date: row.pagado_at || row.created_at,
    amount: Math.round(row.monto_centavos / 100),
    method: "transfer",
    status: "paid",
    type: "Anticipo",
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [patientBalances, setPatientBalances] = useState<PatientBalanceRow[]>([]);
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

        const [rows, advances, accounts, balances] = await Promise.all([
          supabaseRest<PaymentRow[]>(
            `/pagos_cita?created_at=gte.${since.toISOString()}&estado=eq.pagado&select=id,monto_centavos,estado,proveedor_pago,pagado_at,created_at,citas!inner(psicologo_id,inicia_at,pacientes(nombre,apellido))&citas.psicologo_id=eq.${profileId}&order=created_at.desc`
          ),
          supabaseRest<AdvancePaymentRow[]>(
            `/pagos_anticipados_paciente?psicologo_id=eq.${profileId}&pagado_at=gte.${since.toISOString()}&select=id,monto_centavos,pagado_at,created_at,pacientes(nombre,apellido)&order=pagado_at.desc`
          ),
          loadBankAccounts(),
          supabaseRest<PatientBalanceRow[]>(
            `/v_saldos_paciente?psicologo_id=eq.${profileId}&saldo_centavos=gt.0&select=paciente_id,nombre,apellido,saldo_centavos&order=saldo_centavos.desc`
          ),
        ]);

        if (!active) return;
        setPayments(
          [
            ...rows.map((row) => mapPayment(row, psychologistName)),
            ...advances.map((row) => mapAdvancePayment(row, psychologistName)),
          ].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
        );
        setBankAccounts(accounts);
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
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalBankBalance = bankAccounts.reduce(
    (sum, account) => sum + Math.round((account.saldo_actual_centavos || 0) / 100),
    0
  );
  const totalPatientCredit = patientBalances.reduce(
    (sum, balance) => sum + Math.round((balance.saldo_centavos || 0) / 100),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Pagos</h1>
          <p className="text-muted-foreground">
            Gestión de pagos y transacciones
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
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Pagado</p>
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
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Saldo en cuentas</p>
                <p className="text-3xl text-foreground">${totalBankBalance.toLocaleString()}</p>
              </div>
              <div className="bg-[#FFB74D]/10 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-[#FFB74D]" />
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
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Promedio/Sesión</p>
            <p className="text-3xl text-foreground">
              ${Math.round(totalPaid / (filteredPayments.filter((p) => p.status === "paid").length || 1))}
            </p>
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Cuentas bancarias</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cuentas registradas. Al registrar el primer pago podrás crear la cuenta BBVA.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="rounded-md border border-border p-4">
                  <p className="text-sm text-muted-foreground">{account.banco || "Banco"}</p>
                  <p className="text-foreground">{account.nombre}</p>
                  {account.ultimos_4 && (
                    <p className="text-xs text-muted-foreground">Terminación {account.ultimos_4}</p>
                  )}
                  <p className="text-2xl text-foreground mt-3">
                    ${Math.round((account.saldo_actual_centavos || 0) / 100).toLocaleString()} {account.moneda}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Saldos a favor</CardTitle>
        </CardHeader>
        <CardContent>
          {patientBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pacientes con saldo a favor disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patientBalances.map((balance) => (
                <div key={balance.paciente_id} className="rounded-md border border-border p-4">
                  <p className="text-foreground">{fullName(balance) || "Paciente sin nombre"}</p>
                  <p className="text-2xl text-foreground mt-3">
                    ${Math.round(balance.saldo_centavos / 100).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
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
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-center">Método</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Cargando pagos...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay pagos registrados con los filtros seleccionados.
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
                      {payment.psychologist}
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
                    <TableCell className="text-center">
                      <Badge className={method.color}>{method.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patients={patients}
        psychologists={psychologists}
        defaultPsychologist={currentPsychologistId}
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
