"use client";

import React from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Share2,
  Download,
  Calendar as CalendarIcon,
  Banknote,
  Settings,
  QrCode,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { apiService, Transaction, Summary } from "@/lib/api";
import { TransactionDialog } from "./transaction-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardView() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [sortConfig, setSortConfig] = React.useState<{
    key: 'fecha_pago' | 'monto' | 'descripcion' | 'banco_usado' | 'ciudad';
    direction: 'asc' | 'desc';
  }>({ key: 'fecha_pago', direction: 'desc' });

  // WhatsApp Settings
  const [showSettings, setShowSettings] = React.useState(false);
  const [waConfig, setWaConfig] = React.useState({
    groupName: "Prueba",
    fallbackJid: ""
  });
  const [waStatus, setWaStatus] = React.useState<{ connected: boolean; qr: string }>({
    connected: false,
    qr: ""
  });
  const [isResetting, setIsResetting] = React.useState(false);

  // Edit Transaction State
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Load settings from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("whatsapp-config");
    if (saved) {
      setWaConfig(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage
  const saveWaConfig = (config: typeof waConfig) => {
    setWaConfig(config);
    localStorage.setItem("whatsapp-config", JSON.stringify(config));
    setShowSettings(false);
    toast.success("Configuración de WhatsApp guardada");
  };

  const fetchData = React.useCallback(async () => {
    try {
      const [ts, s] = await Promise.all([
        apiService.getTransactions(),
        apiService.getSummary()
      ]);
      setTransactions(ts);
      setSummary(s);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WhatsApp Status Polling
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showSettings) {
      const checkStatus = async () => {
        try {
          const status = await apiService.getWhatsAppStatus();
          setWaStatus(status);
        } catch (err) {
          console.error("Error polling WA status:", err);
        }
      };

      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSettings]);

  const handleWhatsAppLogout = async () => {
    try {
      setIsResetting(true);
      await apiService.logoutWhatsApp();
      toast.success("Sesión cerrada. Generando nuevo QR...");
      setWaStatus({ connected: false, qr: "" });
    } catch (error) {
      toast.error("Error al desvincular WhatsApp");
    } finally {
      setTimeout(() => setIsResetting(false), 2000);
    }
  };

  const handleWhatsApp = async (id: number) => {
    try {
      const target = waConfig.groupName || waConfig.fallbackJid || "Prueba";
      await apiService.sendWhatsApp(id, target);
      toast.success(`Enviando a ${target}...`, {
        description: "El envío se procesa en segundo plano."
      });
    } catch (error) {
      toast.error("Error al enviar WhatsApp");
    }
  };

  const handleExport = () => {
    window.open(`${apiService.getBaseUrl()}/export`, '_blank');
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await apiService.deleteTransaction(id);
      toast.success("Transacción eliminada correctamente");
      fetchData(); // Recargar datos
    } catch (error) {
      toast.error("Error al eliminar la transacción");
    }
  };

  const filteredAndSorted = React.useMemo(() => {
    let items = [...transactions];
    
    // 1. Filter by Date Range
    if (date?.from) {
      const from = new Date(date.from);
      const to = date.to ? new Date(date.to) : from;
      
      items = items.filter(t => {
        // Assume fecha_pago is DD/MM/YYYY
        const [day, month, year] = t.fecha_pago.split('/').map(Number);
        const tDate = new Date(year, month - 1, day);
        return tDate >= from && tDate <= to;
      });
    }

    // 2. Sort logic
    items.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'monto') {
        return sortConfig.direction === 'asc' 
          ? Number(aValue) - Number(bValue) 
          : Number(bValue) - Number(aValue);
      }

      const strA = String(aValue || "").toLowerCase();
      const strB = String(bValue || "").toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [transactions, sortConfig, date]);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Brailer Ledger</h1>
          <p className="text-muted-foreground">Gestión financiera minimalista y arquitectónica.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card/50 border-none shadow-sm hover:bg-card transition-all"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar WA
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card/50 border-none shadow-sm hover:bg-card transition-all"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <TransactionDialog onTransactionCreated={fetchData} />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.1 }}>
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-widest text-primary-foreground/70">Balance Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-primary-foreground">
                Bs. {summary?.total_general.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? "0,00"}
              </div>
              <p className="text-xs text-primary-foreground/50 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {summary?.conteo ?? 0} registros totales
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.1 }}>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Ejecución del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-primary">
                Bs. {summary?.total_mes.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? "0,00"}
              </div>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Movimientos del mes actual
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.1 }}>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Estado Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-primary uppercase">
                Activo
              </div>
              <p className="text-xs text-primary/80 font-medium mt-1 flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Sincronizado con Neon
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar transacción..." 
              className="pl-10 border-none bg-background/50 focus-visible:ring-primary/20 placeholder:text-muted-foreground/50" 
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-muted-foreground cursor-pointer outline-none">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar por: {sortConfig.key === 'fecha_pago' ? 'Fecha' : sortConfig.key === 'monto' ? 'Monto' : 'Banco'}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'fecha_pago', direction: 'desc' })}>
                  Fecha (Reciente)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'fecha_pago', direction: 'asc' })}>
                  Fecha (Antiguo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'monto', direction: 'desc' })}>
                  Monto (Mayor)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'monto', direction: 'asc' })}>
                  Monto (Menor)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'banco_usado', direction: 'asc' })}>
                  Banco (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortConfig({ key: 'ciudad', direction: 'asc' })}>
                  Ciudad (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-muted-foreground cursor-pointer outline-none">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd LLL", { locale: es })} - {" "}
                      {format(date.to, "dd LLL", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "dd LLL, y", { locale: es })
                  )
                ) : (
                  "Rango"
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(val) => setDate(val as DateRange | undefined)}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-card/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border border-border/50">
          <Table>
            <TableHeader className="bg-muted/30 border-none">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest pl-6">Fecha</TableHead>
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest">Descripción</TableHead>
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest text-right">Monto</TableHead>
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest">Banco / Ciudad</TableHead>
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest">Referencia</TableHead>
                <TableHead className="font-bold text-primary/70 uppercase text-[10px] tracking-widest w-20 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Cargando transacciones...</TableCell>
                </TableRow>
              ) : filteredAndSorted.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No hay transacciones que coincidan.</TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((t) => (
                  <TableRow key={t.id} className="border-none group hover:bg-white/60 transition-colors">
                    <TableCell className="pl-6 font-medium text-muted-foreground text-sm">{t.fecha_pago}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{t.descripcion}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${t.monto >= 0 ? 'text-green-600' : 'text-primary'}`}>
                        {t.monto >= 0 ? '+' : ''} Bs. {Math.abs(t.monto).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted text-primary/60 font-medium hover:bg-primary hover:text-white transition-all cursor-default uppercase text-[10px] px-2 py-0">
                          {t.banco_usado}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase">{t.ciudad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground/70">{t.referencia}</TableCell>
                    <TableCell className="text-center pr-6">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                          onClick={() => handleWhatsApp(t.id)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white transition-colors cursor-pointer outline-none">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-none shadow-xl bg-white/95 backdrop-blur-md">
                            <DropdownMenuItem className="text-xs focus:bg-muted cursor-pointer">Ver detalle</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs focus:bg-muted cursor-pointer"
                              onClick={() => handleEdit(t)}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs focus:bg-red-50 text-red-600 cursor-pointer"
                              onClick={() => handleDelete(t.id)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
            <span className="text-xs text-muted-foreground">Sincronizado con Neon DB</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs text-primary/50" onClick={fetchData}>Refrescar</Button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-background/80 backdrop-blur-2xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Configuración de WhatsApp</DialogTitle>
            <p className="text-sm text-muted-foreground">Define el destino predeterminado para tus reportes.</p>
          </DialogHeader>
          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl mb-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                waStatus.connected ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              )} />
              <div>
                <p className="text-sm font-bold text-primary">
                  {waStatus.connected ? "WhatsApp Conectado" : "Esperando Vinculación"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {waStatus.connected ? "Listo para enviar reportes" : "Escanee el código QR"}
                </p>
              </div>
            </div>
            {waStatus.connected && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                onClick={handleWhatsAppLogout}
                disabled={isResetting}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Desvincular
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!waStatus.connected && waStatus.qr && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl mb-6 shadow-inner"
              >
                <div className="relative p-4 bg-white rounded-xl shadow-sm border border-muted">
                  <QRCodeCanvas 
                    value={waStatus.qr} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  {isResetting && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center max-w-[200px]">
                  Abra WhatsApp en su teléfono {">"} Dispositivos vinculados {">"} Vincular un dispositivo.
                </p>
              </motion.div>
            )}

            {!waStatus.connected && !waStatus.qr && !isResetting && (
              <motion.div 
                className="flex flex-col items-center justify-center py-10 opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
              >
                <RefreshCw className="w-10 h-10 animate-spin mb-2" />
                <p className="text-xs">Generando código QR...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 py-4 border-t border-white/5 mt-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-3 h-3" /> Configuración de Envío
              </label>
              <div className="grid gap-4 bg-muted/10 p-4 rounded-xl border border-white/5">
                <div className="grid gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nombre del Grupo</label>
                  <Input 
                    placeholder="Ej: Finanzas Brailer" 
                    value={waConfig.groupName}
                    onChange={(e) => setWaConfig(prev => ({ ...prev, groupName: e.target.value }))}
                    className="bg-card/50 border-none focus-visible:ring-primary/20 h-9 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">JID / Número de Respaldo</label>
                  <Input 
                    placeholder="Ej: 584120000000@s.whatsapp.net" 
                    value={waConfig.fallbackJid}
                    onChange={(e) => setWaConfig(prev => ({ ...prev, fallbackJid: e.target.value }))}
                    className="bg-card/50 border-none focus-visible:ring-primary/20 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setShowSettings(false)}>Cerrar</Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => saveWaConfig(waConfig)}>
              Guardar Configuración
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Diálogo de Edición */}
      <TransactionDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        transactionToEdit={editingTransaction}
        onTransactionCreated={fetchData} // Recargar datos al editar
      />
    </div>
  );
}
