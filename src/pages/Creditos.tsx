import { useState } from 'react';
import { Customer } from '@/types/pos';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Pencil, Trash2, User, CreditCard, DollarSign, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Creditos() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: '',
  });

  // Filter customers
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalCredit = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const customersWithCredit = customers.filter((c) => c.current_balance > 0).length;

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: customer.credit_limit.toString(),
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        credit_limit: '1000',
      });
    }
    setShowCustomerDialog(true);
  };

  const handleSave = async () => {
    const customerData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      is_active: true,
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerData);
    } else {
      await createCustomer(customerData);
    }

    setShowCustomerDialog(false);
  };

  const handleDelete = async (customer: Customer) => {
    if (customer.current_balance > 0) {
      alert('No se puede eliminar un cliente con saldo pendiente');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar a "${customer.name}"?`)) {
      await deleteCustomer(customer.id);
    }
  };

  const handleOpenPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    await updateCustomer(selectedCustomer.id, {
      current_balance: Math.max(0, selectedCustomer.current_balance - amount),
    });

    setShowPaymentDialog(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] p-4 gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Con Saldo Pendiente</p>
              <p className="text-2xl font-bold">{customersWithCredit}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Por Cobrar</p>
              <p className="text-2xl font-bold font-mono">${totalCredit.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Clientes y Créditos
            <Badge variant="secondary">{filteredCustomers.length} clientes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Límite Crédito</TableHead>
                  <TableHead className="text-right">Saldo Actual</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        Cargando clientes...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {customer.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone && (
                          <p className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </p>
                        )}
                        {customer.email && (
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${customer.credit_limit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-mono font-bold',
                          customer.current_balance > 0 ? 'text-destructive' : 'text-success'
                        )}>
                          ${customer.current_balance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${(customer.credit_limit - customer.current_balance).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {customer.current_balance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPayment(customer)}
                              className="gap-1"
                            >
                              <DollarSign className="h-3 w-3" />
                              Abonar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="555-1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle, número, colonia..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                placeholder="1000.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Saldo Actual</p>
                <p className="text-2xl font-bold text-destructive font-mono">
                  ${selectedCustomer.current_balance.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Cantidad a Abonar</Label>
                <Input
                  id="payment"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-xl text-center font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setPaymentAmount(amount.toString())}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPaymentAmount(selectedCustomer.current_balance.toString())}
              >
                Pagar Todo (${selectedCustomer.current_balance.toFixed(2)})
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Registrar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
