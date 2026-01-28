import { useState, useEffect, useRef } from 'react';
import { TicketItem, Customer } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Banknote, CreditCard, Wallet, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentPanelProps {
  items: TicketItem[];
  customer: Customer | null;
  onCheckout: (paymentReceived: number, paymentMethod: 'cash' | 'credit' | 'card', isCredit: boolean) => void;
  onSelectCustomer: () => void;
  loading?: boolean;
}

export function PaymentPanel({
  items,
  customer,
  onCheckout,
  onSelectCustomer,
  loading = false,
}: PaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'card'>('cash');
  const [paymentReceived, setPaymentReceived] = useState<string>('');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;
  const paymentAmount = parseFloat(paymentReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, paymentAmount - total) : 0;
  const canCheckout = items.length > 0 && (paymentMethod !== 'cash' || paymentAmount >= total);

  useEffect(() => {
    if (showCheckoutDialog && paymentInputRef.current) {
      paymentInputRef.current.focus();
      paymentInputRef.current.select();
    }
  }, [showCheckoutDialog]);

  const handleQuickAmount = (amount: number) => {
    setPaymentReceived(amount.toString());
  };

  const handleCheckout = () => {
    if (!canCheckout) return;

    const isCredit = paymentMethod === 'credit';
    if (isCredit && !customer) {
      // Need to select customer for credit sales
      onSelectCustomer();
      return;
    }

    onCheckout(paymentAmount, paymentMethod, isCredit);
    setShowCheckoutDialog(false);
    setPaymentReceived('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCheckout) {
      handleCheckout();
    }
  };

  // Quick amounts
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  return (
    <div className="flex flex-col h-full">
      {/* Customer Section */}
      <div className="p-3 border-b">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onSelectCustomer}
        >
          <User className="h-4 w-4" />
          {customer ? (
            <div className="text-left flex-1">
              <p className="font-medium">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                Crédito disponible: ${(customer.credit_limit - customer.current_balance).toFixed(2)}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">Seleccionar cliente</span>
          )}
        </Button>
      </div>

      {/* Totals */}
      <div className="p-4 space-y-3 flex-1">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold">
            <span>TOTAL:</span>
            <span className="font-mono text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="p-3 border-t bg-muted/30">
        <Button
          className="w-full h-14 text-lg font-bold gap-2"
          size="lg"
          disabled={items.length === 0 || loading}
          onClick={() => setShowCheckoutDialog(true)}
        >
          <span className="function-key bg-primary-foreground/20 text-primary-foreground">F12</span>
          <Check className="h-5 w-5" />
          COBRAR
        </Button>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cobrar Venta</DialogTitle>
            <DialogDescription>
              Total a pagar: <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Efectivo</span>
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Tarjeta</span>
                </Button>
                <Button
                  variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod('credit')}
                  disabled={!customer}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Crédito</span>
                </Button>
              </div>
            </div>

            {/* Payment Amount (only for cash) */}
            {paymentMethod === 'cash' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment">Pago Recibido</Label>
                  <Input
                    ref={paymentInputRef}
                    id="payment"
                    type="number"
                    placeholder="0.00"
                    value={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-2xl h-14 font-mono text-right"
                  />
                </div>

                {/* Quick Amounts */}
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => handleQuickAmount(amount)}
                      className="font-mono"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Change */}
                <Card className={cn('transition-colors', change > 0 ? 'bg-success/10 border-success' : '')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Cambio a Devolver
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={cn('text-3xl font-mono font-bold', change > 0 && 'text-success')}>
                      ${change.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Credit warning */}
            {paymentMethod === 'credit' && !customer && (
              <Card className="bg-warning/10 border-warning">
                <CardContent className="pt-4">
                  <p className="text-sm text-warning-foreground">
                    Selecciona un cliente para ventas a crédito
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout || loading}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {loading ? 'Procesando...' : 'Completar Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
