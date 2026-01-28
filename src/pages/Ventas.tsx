import { useState, useEffect, useRef, useCallback } from 'react';
import { TicketItem, Customer, Product } from '@/types/pos';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TicketList } from '@/components/pos/TicketList';
import { PaymentPanel } from '@/components/pos/PaymentPanel';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CustomerSelect } from '@/components/pos/CustomerSelect';
import { Search, Trash2, Save, Clock } from 'lucide-react';

export default function Ventas() {
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { findProductByBarcode, searchProducts } = useProducts();
  const { customers, searchCustomers } = useCustomers();
  const { createSale, loading: saleLoading } = useSales();
  const { toast } = useToast();

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Focus barcode input
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F2 - Product search
      if (e.key === 'F2') {
        e.preventDefault();
        setShowProductSearch(true);
      }
      // F3 - Select customer
      if (e.key === 'F3') {
        e.preventDefault();
        setShowCustomerSelect(true);
      }
      // F12 - Checkout (handled in PaymentPanel)
      // Escape - Clear barcode input
      if (e.key === 'Escape') {
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addProductToTicket = useCallback((product: Product, quantity: number = 1) => {
    // Check stock
    const existingItem = ticketItems.find((item) => item.product.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + quantity > product.stock) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${product.stock} unidades disponibles de ${product.name}`,
        variant: 'destructive',
      });
      return;
    }

    setTicketItems((items) => {
      if (existingItem) {
        return items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unit_price,
              }
            : item
        );
      }

      // Determine price (wholesale or regular)
      let unitPrice = product.sale_price;
      if (
        product.wholesale_price &&
        product.wholesale_min_qty &&
        quantity >= product.wholesale_min_qty
      ) {
        unitPrice = product.wholesale_price;
      }

      const newItem: TicketItem = {
        id: crypto.randomUUID(),
        product,
        quantity,
        unit_price: unitPrice,
        discount: 0,
        subtotal: quantity * unitPrice,
      };

      return [...items, newItem];
    });

    // Visual feedback
    toast({
      title: 'Producto agregado',
      description: `${product.name} x${quantity}`,
    });
  }, [ticketItems, toast]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = await findProductByBarcode(barcodeInput.trim());
    
    if (product) {
      addProductToTicket(product);
      setBarcodeInput('');
    } else {
      toast({
        title: 'Producto no encontrado',
        description: `No existe un producto con código: ${barcodeInput}`,
        variant: 'destructive',
      });
    }

    barcodeInputRef.current?.focus();
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setTicketItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unit_price,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setTicketItems((items) => items.filter((item) => item.id !== itemId));
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setSelectedCustomer(null);
    barcodeInputRef.current?.focus();
  };

  const handleCheckout = async (
    paymentReceived: number,
    paymentMethod: 'cash' | 'credit' | 'card',
    isCredit: boolean
  ) => {
    const sale = await createSale(
      ticketItems,
      paymentReceived,
      paymentMethod,
      selectedCustomer?.id,
      isCredit
    );

    if (sale) {
      handleClearTicket();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 p-4">
      {/* Main area - Ticket */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Barcode input and actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Escanear código de barras o escribir código..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pos-input flex-1"
                />
                <Button type="submit" variant="secondary">
                  Agregar
                </Button>
              </form>
              <Button
                variant="outline"
                onClick={() => setShowProductSearch(true)}
                className="gap-2"
              >
                <span className="function-key">F2</span>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={handleClearTicket}
                disabled={ticketItems.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar
              </Button>
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendientes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket list */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              Ticket de Venta
              {ticketItems.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {ticketItems.length} artículos
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <TicketList
              items={ticketItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right panel - Payment */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-medium">Panel de Cobro</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <PaymentPanel
            items={ticketItems}
            customer={selectedCustomer}
            onCheckout={handleCheckout}
            onSelectCustomer={() => setShowCustomerSelect(true)}
            loading={saleLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductSearch
        open={showProductSearch}
        onOpenChange={setShowProductSearch}
        onSearch={searchProducts}
        onSelectProduct={(product) => addProductToTicket(product)}
      />

      <CustomerSelect
        open={showCustomerSelect}
        onOpenChange={setShowCustomerSelect}
        customers={customers}
        onSearch={searchCustomers}
        onSelectCustomer={setSelectedCustomer}
        selectedCustomer={selectedCustomer}
      />
    </div>
  );
}
