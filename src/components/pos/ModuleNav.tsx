import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  CreditCard,
  Package,
  Warehouse,
  FileText,
  Settings,
} from 'lucide-react';

interface ModuleNavProps {
  className?: string;
}

const modules = [
  {
    key: 'F1',
    label: 'Ventas',
    icon: ShoppingCart,
    path: '/ventas',
    color: 'bg-primary hover:bg-primary/90',
  },
  {
    key: 'F2',
    label: 'Créditos',
    icon: CreditCard,
    path: '/creditos',
    color: 'bg-module-credits hover:bg-module-credits/90',
  },
  {
    key: 'F3',
    label: 'Productos',
    icon: Package,
    path: '/productos',
    color: 'bg-success hover:bg-success/90',
  },
  {
    key: 'F4',
    label: 'Inventario',
    icon: Warehouse,
    path: '/inventario',
    color: 'bg-module-inventory hover:bg-module-inventory/90',
  },
  {
    key: 'F5',
    label: 'Reportes',
    icon: FileText,
    path: '/reportes',
    color: 'bg-destructive hover:bg-destructive/90',
  },
  {
    key: 'F6',
    label: 'Config',
    icon: Settings,
    path: '/configuracion',
    color: 'bg-muted-foreground hover:bg-muted-foreground/90',
  },
];

export function ModuleNav({ className }: ModuleNavProps) {
  return (
    <nav className={cn('flex items-center gap-1 p-2 bg-muted/50 border-b', className)}>
      {modules.map((module) => (
        <NavLink
          key={module.path}
          to={module.path}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            module.color,
            'text-primary-foreground'
          )}
          activeClassName="ring-2 ring-ring ring-offset-2"
        >
          <span className="function-key">{module.key}</span>
          <module.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{module.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
