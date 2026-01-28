import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data as Customer[];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  };

  const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'current_balance'>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, current_balance: 0 })
        .select()
        .single();

      if (error) throw error;

      await fetchCustomers();
      toast({
        title: 'Cliente creado',
        description: 'El cliente se ha guardado correctamente',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchCustomers();
      toast({
        title: 'Cliente actualizado',
        description: 'Los cambios se han guardado correctamente',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el cliente',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchCustomers();
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente se ha eliminado correctamente',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateBalance = async (customerId: string, amount: number) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Cliente no encontrado');

      const newBalance = customer.current_balance + amount;

      const { error } = await supabase
        .from('customers')
        .update({ current_balance: newBalance })
        .eq('id', customerId);

      if (error) throw error;

      await fetchCustomers();
      return true;
    } catch (error: any) {
      console.error('Error updating balance:', error);
      return false;
    }
  };

  return {
    customers,
    loading,
    fetchCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateBalance,
  };
}
