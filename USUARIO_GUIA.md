# ResidenciasPro - Documentación de Usuario

**ResidenciasPro** es un software de administración integral para conjuntos residenciales. Esta documentación te guiará paso a paso sobre cómo usar la plataforma según tu rol.

---

## 📋 Tabla de Contenidos

- [Acceso a la Plataforma](#acceso-a-la-plataforma)
- [Guía para Administradores](#guía-para-administradores)
- [Guía para Residentes](#guía-para-residentes)
- [Soporte y Problemas Frecuentes](#soporte-y-problemas-frecuentes)

---

## 🔐 Acceso a la Plataforma

### Pasos para Iniciar Sesión

1. **Abre tu navegador** y ve a la URL de la plataforma (ej: `http://localhost:5173`)
2. **En la página de Login**, ingresa:
   - **Usuario**: Tu correo electrónico o nombre de usuario
   - **Contraseña**: Tu contraseña asignada
3. **Haz clic** en el botón "Iniciar Sesión"
4. Si los datos son correctos, serás redirigido al **Dashboard principal**

---

## 👨‍💼 Guía para Administradores

El panel de administrador te permite gestionar todos los aspectos del conjunto residencial.

### 1. Dashboard Administrativo
**Ubicación:** Primera pantalla después de iniciar sesión

**¿Qué verás?**
- Resumen general del conjunto residencial
- Estadísticas de cuotas
- Información de habitantes
- Gráficos de actividad

**Acciones disponibles:**
- Ver ocupación del conjunto
- Monitorear estado de cuotas
- Consultar comunicados activos

---

### 2. Gestión de Residentes

#### 2.1 Ver Lista de Residentes
1. **En el menú lateral**, haz clic en "**Residentes**"
2. Verás una tabla con todos los residentes activos del conjunto
3. **Información mostrada:**
   - Nombre completo
   - Apartamento asignado
   - Correo electrónico
   - Teléfono
   - Fecha de vinculación
   - Estado (activo/inactivo)

#### 2.2 Buscar un Residente Específico
1. En la tabla de Residentes, usa la **barra de búsqueda** en la parte superior
2. Escribe nombre, correo o número de apartamento
3. Los resultados se filtran automáticamente

#### 2.3 Crear un Nuevo Residente
1. En la página "**Residentes**", haz clic en el botón "**+ Nuevo Residente**"
2. Completa el formulario con:
   - **Nombre completo**
   - **Correo electrónico** (debe ser único)
   - **Teléfono** (10 dígitos)
   - **Apartamento** (selecciona de la lista desplegable)
   - **Rol**: Selecciona "Residente" o "Administrador de torre"
3. Haz clic en "**Guardar**"
4. El residente recibirá un correo con sus datos de acceso

#### 2.4 Editar Datos de un Residente
1. En la tabla de Residentes, **haz clic sobre la fila del residente**
2. Los datos se cargarán en el formulario (o haz clic en el botón editar ✏️)
3. Modifica los campos necesarios
4. Haz clic en "**Guardar Cambios**"

#### 2.5 Desactivar un Residente
1. Busca el residente en la tabla
2. Haz clic en el menú de opciones (⋮) en la fila
3. Selecciona "**Desactivar**"
4. Confirma la acción
5. El residente no podrá acceder a la plataforma

---

### 3. Gestión de Cuotas

#### 3.1 Ver Estado de Cuotas
1. En el menú, haz clic en "**Cuotas**"
2. Verás una tabla con:
   - Apartamento/Residente
   - Período (mes/año)
   - Monto
   - Estado (pagada/vencida/próxima)
   - Fecha de vencimiento

#### 3.2 Crear Cuota para un Período
1. En la página de Cuotas, haz clic en "**+ Nueva Cuota**"
2. Completa:
   - **Período**: Selecciona el mes y año
   - **Monto base**: Cantidad que todos los residentes deben pagar
   - **Concepto**: Mantenimiento, servicios, etc.
3. Haz clic en "**Generar Cuotas**"
4. El sistema generará automáticamente cuotas para todos los residentes activos

#### 3.3 Registrar Pago de Cuota
1. En la tabla de Cuotas, **busca la cuota sin pagar**
2. Haz clic en "**Registrar Pago**"
3. Ingresa:
   - **Monto pagado**
   - **Método de pago** (Transferencia, Efectivo, Cheque, etc.)
   - **Fecha de pago**
   - **Referencia** (número de comprobante)
4. Haz clic en "**Confirmar Pago**"

#### 3.4 Generar Reporte de Cuotas
1. En la página de Cuotas, haz clic en "**Generar Reporte**" o **"Descargar PDF"**
2. Selecciona el rango de fechas
3. El reporte mostrará estado de pagos y morosos

---

### 4. PQR (Peticiones, Quejas, Reclamos)

#### 4.1 Ver Todas las PQRs
1. En el menú, haz clic en "**PQR**"
2. Verás todos los PQRs registrados en el conjunto
3. **Estado posibles:**
   - Pendiente (nuevas, sin revisar)
   - En proceso
   - Resuelto
   - Rechazado

#### 4.2 Responder a un PQR
1. **Haz clic sobre un PQR pendiente**
2. Lee la descripción del problema
3. En la sección "**Respuesta**", escribe tu comentario o solución
4. Selecciona el estado: "**En proceso**" o "**Resuelto**"
5. Haz clic en "**Guardar Respuesta**"
6. El residente recibirá una notificación

#### 4.3 Cambiar Estado de un PQR
1. Abre el PQR haciendo clic en su fila
2. En la parte superior, verás un desplegable con el **estado actual**
3. Cámbialo a:
   - **En proceso**: Cuando estés trabajando en ello
   - **Resuelto**: Cuando ya solucionaste el problema
   - **Rechazado**: Si no es posible resolver
4. Los cambios se guardan automáticamente

---

### 5. Comunicados

#### 5.1 Ver Comunicados Activos
1. En el menú, haz clic en "**Comunicados**"
2. Verás lista de todos los comunicados (ordenados por fecha)

#### 5.2 Crear Nuevo Comunicado
1. En la página de Comunicados, haz clic en "**+ Nuevo Comunicado**"
2. Completa el formulario:
   - **Título**: Asunto principal
   - **Contenido**: Descripciones detallada
   - **Fechas**: Desde cuándo hasta cuándo será visible
   - **Destinatarios**: Todos los residentes o grupos específicos
3. Haz clic en "**Publicar**"
4. Los residentes verán el comunicado en sus notificaciones

#### 5.3 Editar o Retirar Comunicado
1. En la tabla de Comunicados, **busca el comunicado**
2. Haz clic en el botón editar ✏️ para modificar
3. O haz clic en el botón eliminar 🗑️ para retirar
4. Confirma la acción

---

### 6. Reportes

#### 6.1 Generar Reportes
1. En el menú, haz clic en "**Reportes**"
2. Selecciona el tipo de reporte:
   - **Ocupación**: Apartamentos ocupados/disponibles
   - **Cuotas**: Estado de pagos por período
   - **Actividad de residentes**: Login, cambios realizados
   - **PQRs**: Cantidad y estado

#### 6.2 Descargar Reporte en PDF
1. Una vez generes el reporte, haz clic en "**Descargar PDF**"
2. Se descargará un archivo con formato profesional
3. Puedes imprimirlo o compartirlo

---

### 7. Edificios/Torres

#### 7.1 Ver Estructura del Conjunto
1. En el menú, haz clic en "**Edificio**"
2. Verás:
   - Torres disponibles
   - Cantidad de apartamentos por torre
   - Ocupación
   - Plantas por torre

#### 7.2 Agregar Nueva Torre
1. En la página Edificio, haz clic en "**+ Nueva Torre**"
2. Completa:
   - **Nombre**: Torre A, Torre B, etc.
   - **Plantas**: Cantidad de pisos
   - **Apartamentos por planta**: Número de unidades
3. Haz clic en "**Crear Torre**"
4. Los apartamentos se crearán automáticamente

---

### 8. Mi Perfil (Admin)

#### 8.1 Actualizar Información Personal
1. En el menú superior derecho, haz clic en tu **nombre o avatar**
2. Selecciona "**Mi Perfil**"
3. Actualiza:
   - Foto de perfil
   - Teléfono
   - Información de contacto
4. Haz clic en "**Guardar**"

#### 8.2 Cambiar Contraseña
1. En la página "**Mi Perfil**", baja hasta "**Seguridad**"
2. Haz clic en "**Cambiar Contraseña**"
3. Ingresa:
   - Contraseña actual
   - Nueva contraseña
   - Confirma la nueva contraseña
4. Haz clic en "**Actualizar**"

---

## 👥 Guía para Residentes

Como residente, puedes acceder a información sobre tu apartamento, cuotas, comunicados y enviar PQRs.

### 1. Dashboard del Residente
**Ubicación:** Primera pantalla después de iniciar sesión

**¿Qué verás?**
- **Tu apartamento**: Torre, número, datos
- **Estado de cuotas**: Próxima a vencer, vencidas, pagadas
- **Comunicados recientes**: Avisos del conjunto
- **Resumen de actividad**: Tus últimas acciones
- **Número de PQRs abiertos**: Peticiones/quejas que enviaste

---

### 2. Ver Mis Cuotas

#### 2.1 Consultar Estado de Pagos
1. En el menú, haz clic en "**Cuotas**"
2. Verás una tabla con:
   - **Período**: Mes y año
   - **Monto**: Valor a pagar
   - **Estado**: Pagada, vencida, próxima
   - **Fecha de vencimiento**: Cuándo se vence
   - **Fecha de pago**: Si ya pagaste

#### 2.2 Filtrar Cuotas
1. En la tabla, usa los filtros en la parte superior:
   - **Por año**: Selecciona 2024, 2025, etc.
   - **Por estado**: Solo pagadas, solo pendientes, etc.
2. Los resultados se actualizan automáticamente

#### 2.3 Descargar Comprobante de Pago
1. En la fila de una cuota pagada, haz clic en "**Descargar Comprobante**"
2. Se descargará un PDF con el recibo de pago
3. Puedes imprimirlo para tus registros

#### 2.4 Descargar Reporte de Cuotas
1. En la página de Cuotas, haz clic en "**Descargar Reporte**"
2. Selecciona el rango de fechas que deseas
3. Se descargará un PDF con todas tus cuotas

---

### 3. PQR - Enviar Peticiones, Quejas o Reclamos

#### 3.1 Crear un Nuevo PQR
1. En el menú, haz clic en "**PQR**"
2. Haz clic en el botón "**+ Nuevo PQR**"
3. Completa el formulario:
   - **Tipo**: Selecciona si es Petición, Queja o Reclamo
   - **Asunto**: Breve descripción del problema
   - **Descripción**: Detalla tu situación
   - **Prioridad**: Baja, Media, Alta
   - **Archivos adjuntos**: Puedes subir fotos/evidencia (opcional)
4. Haz clic en "**Enviar PQR**"
5. Recibirás un número de radicado

#### 3.2 Ver Estado de mis PQRs
1. En la página de PQR, verás **"Mis PQRs"** (filtro automático)
2. Cada PQR muestra:
   - **Número de radicado**: Identificador único
   - **Estado**: Pendiente, En proceso, Resuelto
   - **Fecha de creación**: Cuándo lo enviaste
   - **Respuesta**: Comentarios del administrador

#### 3.3 Ver Respuesta del Administrador
1. **Haz clic sobre un PQR** para abrirlo
2. En la sección "**Respuesta**", verás los comentarios
3. El administrador puede adjuntar documentos o actualizaciones
4. Cuando esté resuelto, verás el estado "Resuelto"

---

### 4. Comunicados

#### 4.1 Ver Comunicados
1. En el menú, haz clic en "**Comunicados**"
2. Verás lista de todos los comunicados vigentes
3. Los comunicados mostrarán:
   - **Título**: Asunto principal
   - **Contenido**: Información completa
   - **Fecha**: Cuándo fue publicado
   - **Vigencia**: Hasta cuándo es válido

#### 4.2 Marcar Comunicado como Leído
1. Haz clic en un comunicado
2. Al leerlo completamente, se marca automáticamente como leído
3. El administrador verá que consultaste el aviso

#### 4.3 Recibir Notificaciones
- Cuando se publica un **nuevo comunicado**, recibirás una **notificación en pantalla**
- Si activaste notificaciones por correo, también te llegará un email

---

### 5. Mi Perfil

#### 5.1 Ver y Actualizar Mi Información
1. En el menú superior derecho, haz clic en tu **nombre o avatar**
2. Selecciona "**Mi Perfil**"
3. Verás tu información:
   - Nombre completo
   - Correo electrónico
   - Teléfono
   - Apartamento asignado
   - Fecha de vinculación
   - Foto de perfil

#### 5.2 Editar Datos Personales
1. En la página "**Mi Perfil**", haz clic en "**Editar**"
2. Puedes actualizar:
   - Teléfono
   - Foto de perfil
   - Información de contacto alternativo
3. Haz clic en "**Guardar Cambios**"

#### 5.3 Cambiar Contraseña
1. En la página "**Mi Perfil**", baja hasta "**Seguridad**"
2. Haz clic en "**Cambiar Contraseña**"
3. Ingresa:
   - Contraseña actual
   - Nueva contraseña (mínimo 8 caracteres)
   - Confirma la nueva contraseña
4. Haz clic en "**Actualizar**"

#### 5.4 Gestionar Notificaciones
1. En la página "**Mi Perfil**", ve a "**Preferencias**"
2. Activa/desactiva:
   - Notificaciones por correo de cuotas
   - Notificaciones de comunicados
   - Notificaciones de respuesta a PQRs
3. Haz clic en "**Guardar**"

---

### 6. Reportes Personales

#### 6.1 Ver Mi Actividad
1. En el menú, haz clic en "**Reportes**"
2. Selecciona "**Mi Actividad**"
3. Verás:
   - Tus logins recientes
   - Cuotas pagadas/vencidas
   - PQRs creados
   - Comunicados consultados

#### 6.2 Descargar Reporte de Cuotas Pagadas
1. En Reportes, selecciona "**Cuotas Pagadas**"
2. Elige el rango de fechas
3. Haz clic en "**Descargar PDF**"
4. Tendrás un comprobante de todos tus pagos

---

## 🆘 Soporte y Problemas Frecuentes

### ❓ Preguntas Frecuentes

#### P: ¿Cómo puedo restablecer mi contraseña?
**R:** Contacta al administrador del conjunto. Él puede generar una nueva contraseña temporal que recibirás por correo.

#### P: ¿Cuál es la fecha límite para pagar una cuota?
**R:** Verifica en la tabla de Cuotas. La fecha de vencimiento aparece para cada período. Después de esa fecha, la cuota se marca como vencida.

#### P: ¿Qué debo incluir en un PQR?
**R:** 
- Descripción clara del problema
- Ubicación (si aplica): Torre, apartamento, zona común
- Fecha en que ocurrió
- Fotos o evidencia (si es posible)

#### P: ¿Dónde veo la respuesta a mi PQR?
**R:** Ve a **Menú → PQR**, busca tu radicado y haz clic. En la sección "Respuesta" verás los comentarios del administrador.

#### P: ¿Cómo descargo un comunicado?
**R:** Abre el comunicado y haz clic en "**Descargar PDF**" si está disponible.

#### P: ¿Por qué no puedo acceder a la plataforma?
**R:** 
- Verifica que tu contraseña sea correcta
- Asegúrate de que tu usuario esté activo (contacta al admin)
- Borra el caché del navegador y vuelve a intentar
- Prueba con otro navegador (Chrome, Firefox, Safari)

### 📞 Contactar Soporte

Si tienes problemas técnicos:
1. Intenta refrescar la página (Ctrl+F5 o Cmd+Shift+R)
2. Borra cookies y caché del navegador
3. Prueba con otro navegador
4. Contacta al administrador del conjunto
5. Si el problema persiste, reporta el error técnico a soporte@residenciaspro.com

---

## 📱 Consejos Útiles

✅ **Recomendaciones:**
- ✔️ Revisa regularmente tus cuotas para evitar mora
- ✔️ Lee los comunicados en el plazo indicado
- ✔️ Adjunta evidencia en tus PQRs para resolver más rápido
- ✔️ Mantén tu perfil actualizado (teléfono, correo)
- ✔️ Cambia tu contraseña regularmente

⚠️ **Evita:**
- ❌ Compartir tu contraseña con otros
- ❌ Usar navegadores obsoletos
- ❌ Deshabilitador JavaScript en el navegador
- ❌ Intentar forzar acceso a otras cuentas

---

**Versión:** 1.0  
**Última actualización:** Mayo 2026  
**Soporte:** Tu administrador del conjunto o soporte técnico
