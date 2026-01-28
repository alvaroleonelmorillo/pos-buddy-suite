import { useState } from 'react';
import { Product } from '@/types/pos';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Warehouse, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Inventario() {
  const { products, loading, fetchProducts } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [savingMovement, setSavingMovement] = useState(false);

  // Filter products
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.stock <= (p.min_stock || 5)
  );

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.purchase_price, 0);

  const handleOpenMovement = (product: Product, type: 'entry' | 'exit') => {
    setSelectedProduct(product);
    setMovementType(type);
    setQuantity('');
    setNotes('');
    setShowMovementDialog(true);
  };

  const handleSaveMovement = async () => {
    if (!selectedProduct || !user) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    if (movementType === 'exit' && qty > selectedProduct.stock) {
      toast({
        title: 'Error',
        description: 'No hay suficiente stock',
        variant: 'destructive',
      });
      return;
    }

    setSavingMovement(true);

    try {
      const previousStock = selectedProduct.stock;
      const newStock = movementType === 'entry' 
        ? previousStock + qty 
        : previousStock - qty;

      // Update product stock
      const { error: productError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id);

      if (productError) throw productError;

      // Create inventory movement record
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: selectedProduct.id,
          user_id: user.id,
          movement_type: movementType === 'entry' ? 'entry' : 'exit',
          quantity: qty,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes || null,
        });

      if (movementError) throw movementError;

      toast({
        title: 'Movimiento registrado',
        description: `${movementType === 'entry' ? 'Entrada' : 'Salida'} de ${qty} unidades`,
      });

      await fetchProducts();
      setShowMovementDialog(false);
    } catch (error: any) {
      console.error('Error saving movement:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el movimiento',
        variant: 'destructive',
      });
    } finally {
      setSavingMovement(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] p-4 gap-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unidades en Stock</p>
              <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-lg font-bold">$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Inventario</p>
              <p className="text-2xl font-bold font-mono">${totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">Todos los Productos</TabsTrigger>
            <TabsTrigger value="low" className="gap-2">
              Stock Bajo
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {lowStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <TabsContent value="all" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Stock Mínimo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                          Cargando inventario...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">
                          {product.barcode || '-'}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category?.name || 'Sin categoría'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {product.stock <= (product.min_stock || 5) && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={cn(
                              'font-mono font-bold',
                              product.stock <= (product.min_stock || 5) ? 'text-destructive' : ''
                            )}>
                              {product.stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {product.min_stock || 5}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(product.stock * product.purchase_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMovement(product, 'entry')}
                              className="gap-1 text-success hover:text-success"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                              Entrada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMovement(product, 'exit')}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <ArrowDownCircle className="h-4 w-4" />
                              Salida
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="low" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Stock Mínimo</TableHead>
                    <TableHead className="text-center">Faltan</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        ¡Excelente! No hay productos con stock bajo
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">
                          {product.barcode || '-'}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{product.name}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-destructive">
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {product.min_stock || 5}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">
                            {Math.max(0, (product.min_stock || 5) - product.stock)} unidades
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenMovement(product, 'entry')}
                            className="gap-1"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                            Reabastecer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Card>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === 'entry' ? (
                <>
                  <ArrowUpCircle className="h-5 w-5 text-success" />
                  Entrada de Mercancía
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-5 w-5 text-destructive" />
                  Salida de Mercancía
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedProduct.barcode || 'Sin código'}
                </p>
                <p className="text-sm mt-2">
                  Stock actual: <span className="font-bold">{selectedProduct.stock}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="text-xl text-center font-mono"
                  min="1"
                  max={movementType === 'exit' ? selectedProduct.stock : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo del movimiento..."
                  rows={2}
                />
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div className="p-3 bg-accent rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Nuevo stock:</p>
                  <p className="text-2xl font-bold font-mono">
                    {movementType === 'entry'
                      ? selectedProduct.stock + parseInt(quantity)
                      : selectedProduct.stock - parseInt(quantity)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMovement}
              disabled={!quantity || parseInt(quantity) <= 0 || savingMovement}
              className={movementType === 'entry' ? 'bg-success hover:bg-success/90' : ''}
            >
              {savingMovement ? 'Guardando...' : 'Registrar Movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
