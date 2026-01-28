

## Plan: Sistema Punto de Venta para Tienda/Abarrotes

### Descripción General
Crearemos un sistema POS completo y funcional, similar a eleventa, diseñado específicamente para tiendas y abarrotes. El sistema tendrá una base de datos en la nube (Supabase) para guardar todos los productos, clientes, ventas e inventario.

---

### 🛒 Módulo 1: Ventas y Cobro (Pantalla Principal)
- **Pantalla de venta** con campo para escanear/escribir código de barras
- **Lista del ticket** mostrando: código, descripción, precio, cantidad, importe
- **Botones de acción rápida**: Buscar producto, agregar artículo común, eliminar artículo
- **Panel de totales**: Total de venta, pago recibido, cambio a devolver
- **Botón de cobro** (F12) para finalizar la venta
- **Tickets pendientes** para guardar ventas en proceso
- **Asignar cliente** a la venta actual

---

### 📦 Módulo 2: Productos e Inventario
- **Catálogo de productos** con: código de barras, descripción, precio compra, precio venta, existencia
- **Alta, edición y baja de productos**
- **Búsqueda** por código o descripción
- **Control de inventario**: entradas y salidas de mercancía
- **Precios de mayoreo** (precio especial por cantidad)
- **Alertas de stock bajo**

---

### 👥 Módulo 3: Clientes y Créditos
- **Registro de clientes**: nombre, teléfono, dirección, límite de crédito
- **Control de cuentas por cobrar**: ventas a crédito y abonos
- **Historial de compras por cliente**
- **Estado de cuenta** de cada cliente

---

### 📊 Módulo 4: Reportes y Corte de Caja
- **Corte de caja diario**: resumen de ventas en efectivo, crédito, devoluciones
- **Reporte de ventas** por día, semana o mes
- **Reporte de productos más vendidos**
- **Ventas del día y devoluciones**
- **Reimprimir último ticket**

---

### ⚙️ Módulo 5: Configuración
- **Datos del negocio**: nombre, dirección, teléfono, logo
- **Usuarios y permisos** (administrador, cajero)
- **Configuración de tickets**

---

### 🎨 Diseño Visual
- Estilo clásico similar a eleventa con colores azul/gris
- Barra de navegación superior con todos los módulos
- Atajos de teclado (F1-F12) para acciones rápidas
- Diseño optimizado para pantallas de escritorio
- Información del usuario y reloj en la esquina

---

### 🗄️ Base de Datos
Utilizaremos **Lovable Cloud (Supabase)** para guardar:
- Productos y sus precios
- Clientes y sus créditos
- Registro de todas las ventas
- Movimientos de inventario
- Cortes de caja

---

### 📱 Funcionalidades Adicionales
- Autenticación de usuarios (login/logout)
- Múltiples tickets/ventas simultáneas
- Búsqueda rápida de productos
- Cálculo automático de cambio

