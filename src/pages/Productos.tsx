import { useState } from 'react';
import { Product, Category } from '@/types/pos';
import { useProducts } from '@/hooks/useProducts';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Productos() {
  const { products, categories, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    purchase_price: '',
    sale_price: '',
    wholesale_price: '',
    wholesale_min_qty: '',
    stock: '',
    min_stock: '',
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        category_id: product.category_id || '',
        purchase_price: product.purchase_price.toString(),
        sale_price: product.sale_price.toString(),
        wholesale_price: product.wholesale_price?.toString() || '',
        wholesale_min_qty: product.wholesale_min_qty?.toString() || '',
        stock: product.stock.toString(),
        min_stock: product.min_stock?.toString() || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        name: '',
        description: '',
        category_id: '',
        purchase_price: '',
        sale_price: '',
        wholesale_price: '',
        wholesale_min_qty: '',
        stock: '',
        min_stock: '5',
      });
    }
    setShowProductDialog(true);
  };

  const handleSave = async () => {
    const productData = {
      barcode: formData.barcode || null,
      name: formData.name,
      description: formData.description || null,
      category_id: formData.category_id || null,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
      wholesale_min_qty: formData.wholesale_min_qty ? parseInt(formData.wholesale_min_qty) : null,
      stock: parseInt(formData.stock) || 0,
      min_stock: parseInt(formData.min_stock) || 5,
      is_active: true,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }

    setShowProductDialog(false);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      await deleteProduct(product.id);
    }
  };

  const getMargin = (product: Product) => {
    if (product.purchase_price === 0) return 0;
    return ((product.sale_price - product.purchase_price) / product.purchase_price) * 100;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] p-4 gap-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Catálogo de Productos
            <Badge variant="secondary">{filteredProducts.length} productos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Compra</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        Cargando productos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
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
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category?.name || (
                          <span className="text-muted-foreground">Sin categoría</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${product.purchase_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ${product.sale_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-mono text-sm',
                          getMargin(product) > 30 ? 'text-success' :
                          getMargin(product) > 15 ? 'text-warning' : 'text-destructive'
                        )}>
                          {getMargin(product).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {product.stock <= (product.min_stock || 5) && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span className={cn(
                            'font-mono',
                            product.stock <= (product.min_stock || 5)
                              ? 'text-destructive font-bold'
                              : ''
                          )}>
                            {product.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product)}
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

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Coca-Cola 600ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Precio de Compra *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio de Venta *</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wholesale_price">Precio Mayoreo</Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  step="0.01"
                  value={formData.wholesale_price}
                  onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesale_min_qty">Cantidad Mín. Mayoreo</Label>
                <Input
                  id="wholesale_min_qty"
                  type="number"
                  value={formData.wholesale_min_qty}
                  onChange={(e) => setFormData({ ...formData, wholesale_min_qty: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Actual *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.sale_price}>
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
