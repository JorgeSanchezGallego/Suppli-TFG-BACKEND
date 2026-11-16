# Suppli · Backend API

**Suppli** es una plataforma web de gestión de proveedores para hostelería, desarrollada como Trabajo de Fin de Grado del ciclo de **Desarrollo de Aplicaciones Web (DAW)**.

El objetivo es quitarle al encargado el papel de cuello de botella en las compras. Cualquier trabajador autorizado del local puede ver qué proveedor suministra cada producto, consultar sus días de reparto y lanzar pedidos sin supervisión constante. Así se sustituyen las libretas, las llamadas y los mensajes sueltos de WhatsApp por un registro digital, centralizado y auditable.

> **Estado actual:** este repositorio contiene **solo el backend (API REST)** y los **diagramas** del proyecto. El frontend en React se desarrollará más adelante.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Entorno de ejecución | Node.js |
| Framework HTTP | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JSON Web Tokens (`jsonwebtoken`) |
| Cifrado de contraseñas | `bcrypt` |
| Subida de imágenes | Multer + Cloudinary (`multer-storage-cloudinary`) |
| Otros | `cors`, `dotenv`, `nodemon` (desarrollo) |

El proyecto completo sigue la arquitectura **MERN** (MongoDB, Express, React, Node.js).

---

## Estructura del proyecto

```
backend-api/
├── Diagramas/            # Diagramas de clases, casos de uso, estados, secuencia y Gantt
├── src/
│   ├── config/           # Conexión a MongoDB (db.js) y Cloudinary (cloudinary.js)
│   ├── controllers/      # Lógica de cada recurso (usuarios, productos, pedidos, bares, proveedores)
│   ├── middlewares/      # Autenticación JWT, control de roles y subida de archivos
│   ├── models/           # Esquemas de Mongoose (Usuario, Bar, Proveedor, Producto, Pedido)
│   ├── routes/           # Definición de los endpoints
│   └── utils/            # Generación/verificación de tokens y utilidades de Cloudinary
├── index.js              # Punto de entrada del servidor
├── .env.example          # Plantilla de variables de entorno
└── package.json
```

---

## Requisitos previos

- **Node.js** 20 o superior y **npm**
- Una base de datos **MongoDB**, ya sea local o en [MongoDB Atlas](https://www.mongodb.com/atlas)
- Una cuenta de **[Cloudinary](https://cloudinary.com/)** para alojar las imágenes de los productos
- Opcional: **Postman** o similar para probar los endpoints

---

## Instalación

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/JorgeSanchezGallego/Suppli-TFG.git
   ```

   ```bash
   cd Suppli-TFG
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   ```

3. **Configura las variables de entorno.** Copia la plantilla y rellena los valores (ver la sección siguiente):

   ```bash
   cp .env.example .env
   ```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto en el que se levanta el servidor. Por defecto `3000`. |
| `DB_URL` | Sí | Cadena de conexión a MongoDB (p. ej. `mongodb+srv://usuario:contraseña@cluster.mongodb.net/suppli`). |
| `JWT_SECRET` | Sí | Clave secreta para firmar y verificar los tokens JWT. Usa una cadena larga y aleatoria. |
| `CLOUDINARY_CLOUD_NAME` | Sí | Nombre de tu *cloud* en Cloudinary. |
| `CLOUDINARY_API_KEY` | Sí | API Key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | Sí | API Secret de Cloudinary. |

Ejemplo (`.env.example`):

```env
PORT=3000
DB_URL=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/suppli
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

> El archivo `.env` está incluido en `.gitignore` y **nunca debe subirse al repositorio**.

---

## Ejecución

**Modo desarrollo** (recarga automática con nodemon):

```bash
npm run dev
```

**Modo producción:**

```bash
npm start
```

Si todo va bien, verás en consola:

```
Servidor corriendo en: http://localhost:3000
Conexión a Cloudinary exitosa
Conectado con éxito a la BBDD 🟢
```

### Datos de prueba (seed)

Para tener datos con los que probar la API (por ejemplo con Insomnia o Postman):

```bash
npm run seed
```

> ⚠️ El seed **vacía** las colecciones de usuarios, bares, proveedores, productos y pedidos de la base de datos indicada en `DB_URL` antes de insertar los datos de prueba. No lo ejecutes contra una base de datos con datos reales.

Los datos están en [`src/data/`](src/data) y el script en [`src/seeds/seed.js`](src/seeds/seed.js). Se crean 3 proveedores, 3 bares, 10 productos, 4 pedidos y estos usuarios, todos con la contraseña `Prueba1234`:

| Correo | Rol | Detalle |
|---|---|---|
| `encargado1@suppli.test` | Encargado | Encargado de *Kiosko Gómiz* y *Noray* |
| `encargado2@suppli.test` | Encargado | Encargado de *Soho Parc* |
| `empleado1@suppli.test` | Empleado | Trabaja en *Kiosko Gómiz* y *Noray* |
| `empleado2@suppli.test` | Empleado | Trabaja en *Kiosko Gómiz* |
| `empleado3@suppli.test` | Empleado | Trabaja en *Soho Parc* |
| `empleado4@suppli.test` | Empleado | Sin bar asignado |
| `proveedor1@suppli.test` | Proveedor | Empresa *Bebidas del Sur* |
| `proveedor2@suppli.test` | Proveedor | Empresa *Cervezas La Cañada* |

> **Nota:** todo el mundo se registra con rol `empleado` y sin bar (si el cuerpo trae `role`, `proveedor` o `bares`, se ignoran). El **primer encargado** hay que crearlo a mano: se registra como cualquier usuario y después se le cambia el `role` a `encargado` en la base de datos (con MongoDB Compass, Atlas o `mongosh`). A partir de ahí, un encargado puede crear bares, asignarles empleados y crear proveedores y convertir a otros usuarios en encargados o proveedores.

---

## Modelo de datos

| Modelo | Campos principales |
|---|---|
| **Usuario** | `nombre`, `apellidos`, `bares` (lista de ref. Bar; bares en los que trabaja un empleado, los asigna el encargado), `proveedor` (ref. Proveedor; obligatorio solo para el rol `proveedor`), `fechaNacimiento`, `residencia`, `correo` (único), `contraseña` (hash bcrypt, mín. 8 caracteres), `telefono`, `role` (`encargado` · `empleado` · `proveedor`) |
| **Bar** | `nombre`, `ubicacion` (no se puede modificar), `encargado` (ref. Usuario; único encargado del bar, que es quien lo crea) |
| **Proveedor** | `nombre_empresa`, `nombre_persona`, `telefono`, `dias_reparto` |
| **Producto** | `proveedor` (ref. Proveedor), `nombre`, `precio`, `medida`, `stock_optimo_invierno`, `stock_optimo_verano`, `categoria`, `imagen` (URL de Cloudinary) |
| **Pedido** | `proveedor`, `bar`, `usuario`, `fecha_pedido`, `estado` (`pendiente` · `enviado` · `entregado`), `productos[]`, `total` |

**Pedidos inmutables:** al crear un pedido, el servidor copia el **nombre** y el **precio unitario** de cada producto en ese momento y calcula el total él mismo. Si después cambia el precio en el catálogo, el historial sigue mostrando el precio original.

---

## Autenticación y roles

- Las contraseñas se guardan cifradas con **bcrypt** (hook `pre('save')` del modelo Usuario).
- Al hacer login, el servidor devuelve un **token JWT** con validez de **1 día**.
- Las rutas protegidas necesitan la cabecera:

  ```
  Authorization: Bearer <token>
  ```

- El middleware `isAuth` verifica el token y carga el usuario. Después, `esEmpleado`, `esEncargado` y `esProveedor` comprueban el rol y devuelven `403` si no tiene permiso.

---

## Endpoints

URL base: `http://localhost:3000/api`

### Usuarios — `/api/usuarios`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/registro` | Público | Registra un nuevo usuario (siempre con rol `empleado`) |
| POST | `/login` | Público | Inicia sesión y devuelve `{ user, token }` |
| GET | `/?nombre=<texto>&role=<rol>` | Encargado | Lista todos los usuarios con sus bares; filtros opcionales: `nombre` (nombre o apellidos) y `role` |
| PATCH | `/:id/rol` | Encargado | Cambia el rol de un usuario (`{ "role": "encargado" }`; para `proveedor` hay que añadir `"proveedor": "<id_proveedor>"`) |

Reglas al cambiar el rol:
- Un encargado no puede cambiar su propio rol.
- Un encargado que todavía tiene bares no puede dejar de ser encargado (habría que borrar antes sus bares).
- Al pasar a `encargado` o `proveedor`, el usuario deja de pertenecer a los bares en los que trabajaba como empleado.
- Al dejar de ser `proveedor`, se desvincula de su empresa proveedora.

### Productos — `/api/productos`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Empleado / Encargado / Proveedor | Lista los productos (con el nombre de su proveedor) |
| GET | `/buscar/nombre/:nombre` | Empleado / Encargado / Proveedor | Busca productos por nombre |
| GET | `/buscar/categoria/:categoria` | Empleado / Encargado / Proveedor | Busca productos por categoría |
| GET | `/buscar/proveedor/:nombre` | Empleado / Encargado / Proveedor | Busca productos por el nombre de la empresa proveedora |
| POST | `/` | Proveedor / Encargado | Crea un producto (`multipart/form-data`, imagen obligatoria en el campo `imagen`) |
| PATCH | `/:id` | Proveedor / Encargado | Actualiza un producto (admite nueva `imagen`; la antigua se borra de Cloudinary) |
| DELETE | `/:id` | Proveedor / Encargado | Elimina un producto y su imagen |

Un usuario **proveedor** solo ve, crea, edita y borra los productos de su propia empresa: los productos que crea se asignan siempre a su proveedor y no puede pasarlos a otro. Para él, los productos de otras empresas no existen (`404`). El **encargado** puede gestionar cualquier producto, pero al crearlo tiene que indicar un `proveedor` existente.

### Pedidos — `/api/pedidos`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/` | Empleado | Crea un pedido para uno de los bares a los que pertenece el empleado (campo `bar`) |
| GET | `/historial` | Encargado / Proveedor | Historial de pedidos: el encargado ve los de todos sus bares (o los de uno con `?bar=<id>`) y el proveedor los que ha recibido su empresa |

Ejemplo de cuerpo para crear un pedido:

```json
{
  "proveedor": "<id_proveedor>",
  "bar": "<id_bar>",
  "productos": [
    { "producto": "<id_producto>", "cantidad": 3 },
    { "producto": "<id_producto>", "cantidad": 1 }
  ]
}
```

### Proveedores — `/api/proveedores`

Los proveedores son comunes a todos los bares.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/?nombre=<texto>` | Cualquier usuario autenticado | Lista los proveedores; `nombre` (opcional) filtra por nombre de empresa |
| GET | `/:id` | Cualquier usuario autenticado | Ver un proveedor |
| POST | `/` | Encargado | Crea un proveedor (`nombre_empresa`, `nombre_persona`, `telefono`, `dias_reparto`) |
| PATCH | `/:id` | Encargado / Proveedor de esa empresa | Edita los datos del proveedor; un usuario proveedor solo puede editar el suyo |
| DELETE | `/:id` | Encargado | Borra el proveedor en cascada: sus productos y sus pedidos se eliminan, y sus usuarios pasan a ser empleados |

### Bares — `/api/bares`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/` | Encargado | Crea un bar (`nombre`, `ubicacion`); el encargado queda como su responsable |
| GET | `/` | Encargado | Lista los bares del encargado |
| PATCH | `/:id` | Encargado del bar | Cambia el nombre del bar (la ubicación no se puede modificar) |
| DELETE | `/:id` | Encargado del bar | Borra el bar y sus pedidos, y lo quita de sus empleados |
| GET | `/:id/pedidos` | Encargado del bar | Pedidos de un bar |
| GET | `/:id/empleados` | Encargado del bar | Empleados de un bar |
| POST | `/:id/empleados` | Encargado del bar | Añade un empleado al bar (`{ "usuarioId": "<id>" }`) |
| DELETE | `/:id/empleados/:usuarioId` | Encargado del bar | Quita un empleado del bar |

Todas las rutas con `/:id` comprueban que el bar pertenece al encargado autenticado; si no, devuelven `403`.

Cualquier ruta que no exista devuelve `404 { "error": "Route not found" }`.

---

## Diagramas

La carpeta [`Diagramas/`](Diagramas) contiene el diseño del proyecto:

- [Diagrama de clases](Diagramas/diagramadeclases2.png)
- [Diagrama de casos de uso](Diagramas/casosdeuso.png)
- [Diagrama de estados](Diagramas/diagramadeestados.png)
- [Diagrama de secuencia](Diagramas/diagramadesecuencia.png)
- [Diagrama de Gantt](Diagramas/DiagramadeGantt.png)

---

## Próximos pasos

- [ ] Frontend en **React**: catálogo visual, carrito de compra y panel de pedidos
- [ ] Envío automático del pedido al proveedor por **WhatsApp** (generación de la URL de WhatsApp Web)
- [x] Gestión de **bares** desde la API (crear, renombrar, borrar y asignar empleados)
- [x] CRUD completo de **proveedores** desde la API
- [ ] Gestión del **estado** de los pedidos (`pendiente` → `enviado` → `entregado`)

---

## Autor

**Jorge Sánchez Gallego**: TFG del ciclo de Desarrollo de Aplicaciones Web
Tutor: José Manuel Villar Ferradal
