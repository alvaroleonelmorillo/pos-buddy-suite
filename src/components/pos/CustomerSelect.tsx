import { useState, useEffect, useRef } from 'react';
import { Customer } from '@/types/pos';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, User, UserPlus, Phone, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSearch: (query: string) => Promise<Customer[]>;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
}

export function CustomerSelect({
  open,
  onOpenChange,
  customers,
  onSearch,
  onSelectCustomer,
  selectedCustomer,
}: CustomerSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>(customers);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (query.length === 0) {
      setResults(customers);
      return;
    }

    const search = async () => {
      setLoading(true);
      const found = await onSearch(query);
      setResults(found);
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, onSearch, customers]);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onOpenChange(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seleccionar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Buscar por nombre o teléfono..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <User className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No se encontraron clientes</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((customer) => (
                  <button
                    key={customer.id}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 text-left transition-colors',
                      selectedCustomer?.id === customer.id
                        ? 'bg-accent'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleSelect(customer)}
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.address && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />
                            {customer.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-sm font-mono',
                        customer.current_balance > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        ${customer.current_balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Límite: ${customer.credit_limit.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          {selectedCustomer && (
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" />
              Quitar Cliente
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
