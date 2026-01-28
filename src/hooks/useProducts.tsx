import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const formattedProducts = (data || []).map(p => ({
        ...p,
        category: p.categories as Category | undefined,
      })) as Product[];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        category: data.categories as Category | undefined,
      } as Product;
    } catch (error) {
      console.error('Error finding product:', error);
      return null;
    }
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map(p => ({
        ...p,
        category: p.categories as Category | undefined,
      })) as Product[];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  };

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
      toast({
        title: 'Producto creado',
        description: 'El producto se ha guardado correctamente',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el producto',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: 'Producto actualizado',
        description: 'Los cambios se han guardado correctamente',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el producto',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchProducts();
      toast({
        title: 'Producto eliminado',
        description: 'El producto se ha eliminado correctamente',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    products,
    categories,
    loading,
    fetchProducts,
    findProductByBarcode,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
