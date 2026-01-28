import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, TicketItem } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useSales() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createSale = async (
    items: TicketItem[],
    paymentReceived: number,
    paymentMethod: 'cash' | 'credit' | 'card',
    customerId?: string | null,
    isCredit: boolean = false
  ) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para realizar ventas',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const total = subtotal; // Could add tax calculation here
      const changeGiven = paymentMethod === 'cash' ? Math.max(0, paymentReceived - total) : 0;

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          customer_id: customerId,
          subtotal,
          discount: 0,
          tax: 0,
          total,
          payment_received: paymentReceived,
          change_given: changeGiven,
          payment_method: paymentMethod,
          is_credit: isCredit,
          status: 'completed',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // If it's a credit sale, update customer balance
      if (isCredit && customerId) {
        // Get current balance and update
        const { data: customerData } = await supabase
          .from('customers')
          .select('current_balance')
          .eq('id', customerId)
          .single();

        if (customerData) {
          await supabase
            .from('customers')
            .update({ current_balance: customerData.current_balance + total })
            .eq('id', customerId);
        }
      }

      toast({
        title: '¡Venta completada!',
        description: `Ticket #${sale.ticket_number} - Total: $${total.toFixed(2)}`,
      });

      return sale as Sale;
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar la venta',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSalesToday = async (): Promise<Sale[]> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  };

  const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name), sale_items(*, products(name))')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  };

  const getSaleDetails = async (saleId: string): Promise<Sale | null> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name), sale_items(*, products(name, barcode))')
        .eq('id', saleId)
        .single();

      if (error) throw error;
      return data as Sale;
    } catch (error) {
      console.error('Error fetching sale details:', error);
      return null;
    }
  };

  return {
    loading,
    createSale,
    getSalesToday,
    getSalesByDateRange,
    getSaleDetails,
  };
}
