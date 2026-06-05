import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface NetworkPayoutsProps {
  psychologistName: string;
}

const mockWeeklyCutoff = {
  week: "9-15 Oct 2024",
  status: "pending_invoice",
  totalSessions: 12,
  amount: 4200, // 12 sesiones * $350
  patients: [
    {
      id: 1,
      name: "Luis Hernández",
      company: "TechCorp Solutions",
      date: "2024-10-09",
      time: "14:00",
      attended: true,
      amount: 350,
    },
    {
      id: 2,
      name: "Sofia Ramírez",
      company: "InnovateTech MX",
      date: "2024-10-10",
      time: "10:00",
      attended: true,
      amount: 350,
    },
    {
      id: 3,
      name: "Carmen Díaz",
      company: "Global Finance Corp",
      date: "2024-10-11",
      time: "11:00",
      attended: true,
      amount: 350,
    },
    {
      id: 4,
      name: "Luis Hernández",
      company: "TechCorp Solutions",
      date: "2024-10-12",
      time: "14:00",
      attended: false,
      amount: 0,
    },
  ],
};

const mockPayoutHistory = [
  {
    id: "PAY-2024-003",
    week: "2-8 Oct 2024",
    sessions: 10,
    amount: 3500,
    invoiceUploaded: "2024-10-09",
    status: "paid",
    paidDate: "2024-10-12",
    invoiceNumber: "A-001234",
  },
  {
    id: "PAY-2024-002",
    week: "25 Sep - 1 Oct 2024",
    sessions: 8,
    amount: 2800,
    invoiceUploaded: "2024-10-02",
    status: "paid",
    paidDate: "2024-10-05",
    invoiceNumber: "A-001233",
  },
  {
    id: "PAY-2024-001",
    week: "18-24 Sep 2024",
    sessions: 15,
    amount: 5250,
    invoiceUploaded: "2024-09-25",
    status: "paid",
    paidDate: "2024-09-28",
    invoiceNumber: "A-001232",
  },
];

export function NetworkPayouts({ psychologistName }: NetworkPayoutsProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);

  const handleUploadInvoice = () => {
    if (!invoiceNumber || !invoiceFile || !xmlFile) {
      toast.error("Por favor completa todos los campos y sube ambos archivos");
      return;
    }

    toast.success("Factura enviada correctamente. Recibirás el pago en 3-5 días hábiles.");
    setShowUploadDialog(false);
    setInvoiceNumber("");
    setInvoiceFile(null);
    setXmlFile(null);
  };

  const handleViewDetail = (payout: any) => {
    setSelectedPayout(payout);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        );
      case "pending_invoice":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente Factura
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            En Proceso
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-foreground mb-2">Cortes de Pago MindCare</h1>
        <p className="text-muted-foreground">
          Gestiona tus pagos por sesiones de pacientes de la red
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-2 border-[#4DB6AC]/20 bg-gradient-to-br from-[#4DB6AC]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#4DB6AC]" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground mb-2">Pacientes de la Red MindCare</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recibes <strong>$350 MXN por sesión efectivamente atendida</strong> de pacientes que te eligen a través de la red de empresas. Los pagos se realizan semanalmente al subir tu factura.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#66BB6A]" />
                  <span className="text-muted-foreground">Corte semanal automático</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#66BB6A]" />
                  <span className="text-muted-foreground">Pago en 3-5 días hábiles</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#66BB6A]" />
                  <span className="text-muted-foreground">Factura electrónica requerida</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="current">Corte Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Current Cutoff Tab */}
        <TabsContent value="current" className="space-y-6">
          {/* Summary Card */}
          <Card className="border-2 border-[#7E57C2]/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Corte Semanal</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {mockWeeklyCutoff.week}
                  </CardDescription>
                </div>
                {getStatusBadge(mockWeeklyCutoff.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sesiones Atendidas</p>
                  <p className="text-3xl text-foreground">{mockWeeklyCutoff.totalSessions}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-3xl text-[#4DB6AC]">${mockWeeklyCutoff.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {mockWeeklyCutoff.totalSessions} sesiones × $350
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="text-sm text-[#FF9800]">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Esperando tu factura
                  </p>
                </div>
              </div>

              <Separator />

              {/* Upload Invoice Button */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                <div>
                  <p className="text-foreground mb-1">Envía tu factura para recibir el pago</p>
                  <p className="text-sm text-muted-foreground">
                    Sube tu factura PDF y XML para procesar el pago
                  </p>
                </div>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-[#4DB6AC] text-white hover:bg-[#4DB6AC]/90 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir Factura
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Sesiones</CardTitle>
              <CardDescription>
                Sesiones efectivamente atendidas esta semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockWeeklyCutoff.patients.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      session.attended
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-foreground">{session.name}</p>
                          {session.attended && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {session.company}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(session.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          • {session.time}
                        </p>
                      </div>
                      <div className="text-right">
                        {session.attended ? (
                          <>
                            <p className="text-lg text-[#4DB6AC]">${session.amount}</p>
                            <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700 border-green-200">
                              Asistió
                            </Badge>
                          </>
                        ) : (
                          <>
                            <p className="text-lg text-muted-foreground line-through">$350</p>
                            <Badge variant="outline" className="text-xs mt-1 bg-gray-50 text-gray-600 border-gray-200">
                              No asistió
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos tus pagos recibidos de MindCare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPayoutHistory.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-foreground">Corte: {payout.week}</p>
                          {getStatusBadge(payout.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {payout.sessions} sesiones atendidas
                            </span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Factura: {payout.invoiceNumber}
                            </span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              Subida: {new Date(payout.invoiceUploaded).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Pagado: {new Date(payout.paidDate).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl text-[#4DB6AC] mb-2">
                          ${payout.amount.toLocaleString()}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(payout)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="w-3 h-3" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Pagado</p>
                    <p className="text-2xl text-foreground">
                      $
                      {mockPayoutHistory
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Sesiones Totales</p>
                    <p className="text-2xl text-foreground">
                      {mockPayoutHistory.reduce((sum, p) => sum + p.sessions, 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Promedio Semanal</p>
                    <p className="text-2xl text-foreground">
                      $
                      {Math.round(
                        mockPayoutHistory.reduce((sum, p) => sum + p.amount, 0) /
                          mockPayoutHistory.length
                      ).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Factura</DialogTitle>
            <DialogDescription>
              Sube tu factura PDF y XML para procesar el pago de ${mockWeeklyCutoff.amount.toLocaleString()} MXN
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura *</Label>
              <Input
                id="invoiceNumber"
                placeholder="Ej: A-001234"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">Factura PDF *</Label>
              <Input
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              />
              {invoiceFile && (
                <p className="text-xs text-[#66BB6A]">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {invoiceFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="xmlFile">Archivo XML *</Label>
              <Input
                id="xmlFile"
                type="file"
                accept=".xml"
                onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
              />
              {xmlFile && (
                <p className="text-xs text-[#66BB6A]">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {xmlFile.name}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                <strong>Importante:</strong> Debes facturar a MindCare como receptor. El pago se realizará en 3-5 días hábiles.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadInvoice}
              className="bg-[#4DB6AC] text-white hover:bg-[#4DB6AC]/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Pago</DialogTitle>
            <DialogDescription>
              {selectedPayout?.week}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID de Pago</Label>
                <p className="text-foreground">{selectedPayout?.id}</p>
              </div>
              <div>
                <Label>Monto Total</Label>
                <p className="text-2xl text-[#4DB6AC]">
                  ${selectedPayout?.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <Label>Sesiones Atendidas</Label>
                <p className="text-foreground">{selectedPayout?.sessions}</p>
              </div>
              <div>
                <Label>Factura</Label>
                <p className="text-foreground">{selectedPayout?.invoiceNumber}</p>
              </div>
              <div>
                <Label>Fecha de Subida</Label>
                <p className="text-foreground">
                  {selectedPayout && new Date(selectedPayout.invoiceUploaded).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <Label>Fecha de Pago</Label>
                <p className="text-foreground">
                  {selectedPayout && new Date(selectedPayout.paidDate).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
