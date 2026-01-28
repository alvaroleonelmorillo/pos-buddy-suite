import { TicketItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketListProps {
  items: TicketItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  className?: string;
}

export function TicketList({ items, onUpdateQuantity, onRemoveItem, className }: TicketListProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Producto</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-2 text-center">Cant.</div>
        <div className="col-span-2 text-right">Importe</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <ShoppingCartEmpty className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No hay artículos en el ticket</p>
            <p className="text-xs">Escanea un código de barras o busca un producto</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-muted/50 transition-colors group"
              >
                <div className="col-span-1 text-sm text-muted-foreground">
                  {index + 1}
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.product.barcode || 'Sin código'}
                  </p>
                </div>
                <div className="col-span-2 text-right text-sm font-mono">
                  ${item.unit_price.toFixed(2)}
                </div>
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="col-span-2 text-right text-sm font-mono font-bold">
                  ${item.subtotal.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Summary */}
      {items.length > 0 && (
        <div className="border-t bg-muted/30 p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Artículos:</span>
            <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingCartEmpty({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      <line x1="10" y1="11" x2="18" y2="11" />
    </svg>
  );
}
