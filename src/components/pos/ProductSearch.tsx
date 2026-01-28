import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/pos';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => Promise<Product[]>;
  onSelectProduct: (product: Product) => void;
}

export function ProductSearch({
  open,
  onOpenChange,
  onSearch,
  onSelectProduct,
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const products = await onSearch(query);
      setResults(products);
      setSelectedIndex(0);
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onOpenChange(false);
        break;
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            ref={inputRef}
            placeholder="Escriba nombre o código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 text-lg"
          />

          <ScrollArea className="h-[300px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                {query.length < 2 ? (
                  <>
                    <Package className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">Escriba al menos 2 caracteres para buscar</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron productos</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {results.map((product, index) => (
                  <button
                    key={product.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      index === selectedIndex ? 'bg-accent' : 'hover:bg-muted'
                    )}
                    onClick={() => handleSelect(product)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {product.barcode || 'Sin código'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-primary">
                        ${product.sale_price.toFixed(2)}
                      </p>
                      <p className={cn(
                        'text-xs',
                        product.stock <= (product.min_stock || 5)
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}>
                        Stock: {product.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="text-xs text-muted-foreground text-center">
            Use ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
