import { useState, useEffect } from 'react';
import { Sale } from '@/types/pos';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  CreditCard,
  Banknote,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reportes() {
  const { getSalesToday, getSalesByDateRange } = useSales();
  const [salesToday, setSalesToday] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const sales = await getSalesToday();
    setSalesToday(sales);
    setLoading(false);
  };

  // Calculate stats
  const totalSales = salesToday.reduce((sum, s) => sum + s.total, 0);
  const cashSales = salesToday
    .filter((s) => s.payment_method === 'cash')
    .reduce((sum, s) => sum + s.total, 0);
  const cardSales = salesToday
    .filter((s) => s.payment_method === 'card')
    .reduce((sum, s) => sum + s.total, 0);
  const creditSales = salesToday
    .filter((s) => s.is_credit)
    .reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = salesToday.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes del Día</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Button onClick={loadSales} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas del Día</p>
                <p className="text-3xl font-bold font-mono">${totalSales.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-3xl font-bold">{totalTransactions}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-3xl font-bold font-mono">${averageTicket.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas a Crédito</p>
                <p className="text-3xl font-bold font-mono text-destructive">${creditSales.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Banknote className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p className="text-xl font-bold font-mono">${cashSales.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tarjeta</p>
              <p className="text-xl font-bold font-mono">${cardSales.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <FileText className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p className="text-xl font-bold font-mono">${creditSales.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales list */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ventas del Día
            <Badge variant="secondary">{salesToday.length} ventas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Cambio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        Cargando ventas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : salesToday.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No hay ventas registradas hoy
                    </TableCell>
                  </TableRow>
                ) : (
                  salesToday.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-bold">
                        #{sale.ticket_number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sale.created_at), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        {(sale as any).customers?.name || (
                          <span className="text-muted-foreground">Público General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          sale.payment_method === 'cash' ? 'default' :
                          sale.payment_method === 'card' ? 'secondary' : 'outline'
                        }>
                          {sale.payment_method === 'cash' ? 'Efectivo' :
                           sale.payment_method === 'card' ? 'Tarjeta' : 'Crédito'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ${sale.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${sale.payment_received.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success">
                        ${sale.change_given.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          sale.status === 'completed' ? 'default' :
                          sale.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {sale.status === 'completed' ? 'Completada' :
                           sale.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
