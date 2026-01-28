import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessConfig } from '@/types/pos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Store, User, Shield, Save } from 'lucide-react';

export default function Configuracion() {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    tax_rate: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .single();

      if (error) throw error;

      setConfig(data as BusinessConfig);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        tax_rate: data.tax_rate?.toString() || '16',
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_config')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          tax_rate: parseFloat(formData.tax_rate) || 16,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente',
      });

      await fetchConfig();
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración de tu negocio</p>
        </div>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Datos del Negocio
          </CardTitle>
          <CardDescription>
            Información que aparecerá en los tickets y reportes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Negocio</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mi Tienda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, colonia, ciudad..."
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="tax_rate">Tasa de IVA (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
              placeholder="16"
            />
          </div>

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil
          </CardTitle>
          <CardDescription>
            Información de tu cuenta de usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={profile?.full_name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Rol: {role?.role === 'admin' ? 'Administrador' : 'Cajero'}</p>
              <p className="text-xs text-muted-foreground">
                {role?.role === 'admin' 
                  ? 'Tienes acceso completo al sistema' 
                  : 'Acceso limitado a ventas y consultas'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Atajos de Teclado</CardTitle>
          <CardDescription>
            Teclas rápidas para una operación más eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Ir a Ventas</span>
              <kbd className="px-2 py-1 bg-background rounded border text-sm font-mono">F1</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Buscar Producto</span>
              <kbd className="px-2 py-1 bg-background rounded border text-sm font-mono">F2</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Seleccionar Cliente</span>
              <kbd className="px-2 py-1 bg-background rounded border text-sm font-mono">F3</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Cobrar Venta</span>
              <kbd className="px-2 py-1 bg-background rounded border text-sm font-mono">F12</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Limpiar Campo</span>
              <kbd className="px-2 py-1 bg-background rounded border text-sm font-mono">Esc</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
