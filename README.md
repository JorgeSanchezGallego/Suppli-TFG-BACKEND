# Suppli · Backend API

**Suppli** es una plataforma web de gestión de proveedores para hostelería, desarrollada como Trabajo de Fin de Grado del ciclo de **Desarrollo de Aplicaciones Web (DAW)**.

El objetivo es quitarle al encargado el papel de cuello de botella en las compras. Cualquier trabajador autorizado del local puede ver qué proveedor suministra cada producto, consultar sus días de reparto y lanzar pedidos sin supervisión constante. Así se sustituyen las libretas, las llamadas y los mensajes sueltos de WhatsApp por un registro digital, centralizado y auditable.

> **Estado actual:** este repositorio contiene **solo el backend (API REST)** y los **diagramas** del proyecto. El frontend en React está en desarrollo en su propio repositorio: [Suppli-TFG-FRONTEND](https://github.com/JorgeSanchezGallego/Suppli-TFG-FRONTEND).

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
├── Insomnia-pruebas/     # Colección de Insomnia y capturas de las pruebas de cada endpoint
├── src/
│   ├── config/           # Conexión a MongoDB (db.js) y Cloudinary (cloudinary.js)
│   ├── controllers/      # Lógica de cada recurso (usuarios, productos, pedidos, bares, proveedores)
│   ├── data/             # Datos de prueba que carga el seed
│   ├── middlewares/      # Autenticación JWT, control de roles y subida de archivos
│   ├── models/           # Esquemas de Mongoose (Usuario, Bar, Proveedor, Producto, Pedido)
│   ├── routes/           # Definición de los endpoints
│   ├── seeds/            # Script que carga los datos de prueba (npm run seed)
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
- Opcional: **Insomnia** (o Postman) para probar los endpoints con la colección incluida

---

## Instalación

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/JorgeSanchezGallego/Suppli-TFG-BACKEND.git
   ```

   ```bash
   cd Suppli-TFG-BACKEND
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
| **Pedido** | `proveedor`, `bar`, `usuario`, `fecha_pedido`, `estado` (`pendiente` · `entregado`), `productos[]`, `total` |

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
| GET | `/yo` | Cualquier usuario autenticado | Devuelve los datos actualizados del usuario que ha iniciado sesión (sin contraseña, con sus bares y su empresa si es proveedor). El frontend lo usa para refrescar la sesión, por ejemplo cuando un encargado acaba de añadir al empleado a un bar |
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
| GET | `/historial` | Empleado / Encargado / Proveedor | Historial de pedidos, con el bar, el proveedor y quién lo hizo: el encargado ve los de todos sus bares y el empleado los de los bares en los que trabaja (los dos pueden filtrar uno con `?bar=<id>`); el proveedor ve los que ha recibido su empresa |
| PATCH | `/:id/estado` | Empleado / Encargado | Marca el pedido como entregado (`{ "estado": "entregado" }`) |

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

**Estados del pedido.** Todo pedido se crea como `pendiente` y solo puede pasar a `entregado` cuando llega la mercancía al local. Pueden marcarlo el **encargado del bar** o **cualquier empleado de ese bar**. Un pedido `entregado` ya no se puede modificar, y no se puede volver a `pendiente`.

Si el usuario no tiene relación con el pedido (no es de su bar), la API responde `404`, como si no existiera. Cualquier otro estado distinto de `entregado` devuelve `400`.

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

## Pruebas con Insomnia

En [`Insomnia-pruebas/PruebasEndpoints.yaml`](Insomnia-pruebas/PruebasEndpoints.yaml) está la colección con las peticiones de todos los endpoints, organizadas en carpetas (Usuarios, Pedidos, Proveedores, Productos y Bares). Dentro de cada una hay una subcarpeta de **pruebas denegadas** (*Peticiones Denegadas*, *Pedidos Denegados*, *Proveedores Denegados*, *Productos Denegados* y *Bares Denegados*) con peticiones que la API debe rechazar: datos que faltan o no son válidos, falta de permisos y recursos de otro usuario. Están resumidas en [Pruebas denegadas](#pruebas-denegadas).

### 1. Preparar los datos

Con el `.env` configurado, carga los datos de prueba y arranca el servidor:

```bash
npm run seed
```

```bash
npm run dev
```

### 2. Importar la colección

En Insomnia: **Import** (o *Create → Import*) y selecciona el archivo `PruebasEndpoints.yaml`. También se puede importar en Postman.

### 3. Iniciar sesión y usar el token

Los tokens que trae la colección **ya han caducado** (duran 1 día), así que hay que iniciar sesión y sustituirlos:

1. Ejecuta **Usuarios → Login encargado** (o cualquier login) con uno de los usuarios de prueba. Los correos, el rol de cada uno y la contraseña están en la tabla de [Datos de prueba (seed)](#datos-de-prueba-seed) y en [`src/data/usuarios.js`](src/data/usuarios.js).
2. Copia el `token` de la respuesta.
3. En la petición que quieras probar, abre la pestaña **Auth → Bearer Token** y pega el token.

Cada endpoint necesita un rol concreto (ver la columna *Acceso* de las tablas de [Endpoints](#endpoints)). Por ejemplo:

| Para probar… | Inicia sesión con |
|---|---|
| Bares, cambiar roles, buscar usuarios, crear o borrar proveedores | `encargado1@suppli.test` |
| Crear pedidos | `empleado1@suppli.test` |
| Historial de su empresa, gestionar sus productos | `proveedor1@suppli.test` |

### 4. Sustituir los IDs

Los IDs que aparecen en las URL y en los cuerpos de las peticiones son los de la base de datos con la que se hicieron las pruebas. Cada vez que se ejecuta el seed se generan IDs nuevos, así que hay que cogerlos de las respuestas de los listados:

| Necesitas el ID de… | Obtenlo con | Rol |
|---|---|---|
| Un usuario | `GET /api/usuarios?nombre=<nombre>` | Encargado |
| Un bar | `GET /api/bares` (o `user.bares` en la respuesta del login de un empleado) | Encargado / Empleado |
| Un proveedor | `GET /api/proveedores` | Cualquiera |
| Un producto | `GET /api/productos` | Cualquiera |
| Un pedido | `GET /api/pedidos/historial` | Encargado / Proveedor |

### 5. Crear o editar productos con imagen

La petición **Productos → Crear Producto** usa un cuerpo *Multipart Form* con un archivo en el campo `imagen`. La ruta del archivo de la colección es la del equipo donde se hicieron las pruebas, así que hay que seleccionar una imagen propia (formatos permitidos: jpg, jpeg, png, gif y webp). Si Insomnia no puede leer el archivo, hay que permitir su carpeta en *Preferences → General → Security*.

> Las pruebas de borrar y de cambiar roles modifican los datos. Para volver a dejarlos como al principio, ejecuta otra vez `npm run seed`.

### Capturas de las pruebas

En [`Insomnia-pruebas/Capturas-Endpoints/`](Insomnia-pruebas/Capturas-Endpoints) hay una captura de la prueba de cada endpoint, con la petición y la respuesta obtenida:

**Usuarios**
- [Registro de usuario](Insomnia-pruebas/Capturas-Endpoints/Usuarios/RegistroDeUsuario.png) · [Registro duplicado](Insomnia-pruebas/Capturas-Endpoints/Usuarios/RegistroDuplicado.png)
- [Login](Insomnia-pruebas/Capturas-Endpoints/Usuarios/Login.png) · [Login fallido](Insomnia-pruebas/Capturas-Endpoints/Usuarios/LoginFallido.png)
- [Ver usuarios](Insomnia-pruebas/Capturas-Endpoints/Usuarios/VerUsuarios.png) · [por nombre](Insomnia-pruebas/Capturas-Endpoints/Usuarios/VerUsuariosPorNombre.png) · [por apellido](Insomnia-pruebas/Capturas-Endpoints/Usuarios/VerUsuariosPorApellido.png) · [por rol](Insomnia-pruebas/Capturas-Endpoints/Usuarios/VerUsuariosPorRole.png) · [por rol y nombre](Insomnia-pruebas/Capturas-Endpoints/Usuarios/VerUsuariosPorRoleyNombre.png)
- [Cambiar rol](Insomnia-pruebas/Capturas-Endpoints/Usuarios/CambiarRol.png)

**Pedidos**
- [Crear pedido](Insomnia-pruebas/Capturas-Endpoints/Pedidos/CrearPedido.png)
- [Ver pedidos](Insomnia-pruebas/Capturas-Endpoints/Pedidos/VerPedidos.png) · [por bar](Insomnia-pruebas/Capturas-Endpoints/Pedidos/VerPedidosPorBar.png)

**Proveedores**
- [Ver proveedores](Insomnia-pruebas/Capturas-Endpoints/Proveedor/VerProveedores.png) · [por nombre](Insomnia-pruebas/Capturas-Endpoints/Proveedor/VerProveedorPorNombre.png) · [por ID](Insomnia-pruebas/Capturas-Endpoints/Proveedor/VerProveedorPorID.png)
- [Crear proveedor](Insomnia-pruebas/Capturas-Endpoints/Proveedor/CrearProveedor.png) · [Editar proveedor](Insomnia-pruebas/Capturas-Endpoints/Proveedor/EditarProveedor.png) · [Borrar proveedor](Insomnia-pruebas/Capturas-Endpoints/Proveedor/BorrarProveedor.png)

**Productos**
- [Ver productos](Insomnia-pruebas/Capturas-Endpoints/Productos/VerProductos.png)
- [Buscar por nombre](Insomnia-pruebas/Capturas-Endpoints/Productos/BuscarPorNombre.png) · [por categoría](Insomnia-pruebas/Capturas-Endpoints/Productos/BuscarPorCategoria.png) · [por proveedor](Insomnia-pruebas/Capturas-Endpoints/Productos/BuscarPorProveedor.png)
- [Crear producto](Insomnia-pruebas/Capturas-Endpoints/Productos/CrearProducto.png) · [Editar producto](Insomnia-pruebas/Capturas-Endpoints/Productos/EditarProducto.png) · [Borrar producto](Insomnia-pruebas/Capturas-Endpoints/Productos/BorrarProducto.png)

**Bares**
- [Crear bar](Insomnia-pruebas/Capturas-Endpoints/Bar/CrearBar.png) · [Ver mis bares](Insomnia-pruebas/Capturas-Endpoints/Bar/VerBares.png) · [Borrar bar](Insomnia-pruebas/Capturas-Endpoints/Bar/BorrarBar.png)
- [Añadir empleado](Insomnia-pruebas/Capturas-Endpoints/Bar/AñadirEmpleadoBar.png) · [Quitar empleado](Insomnia-pruebas/Capturas-Endpoints/Bar/QuitarEmpleadoBar.png) · [Ver empleados](Insomnia-pruebas/Capturas-Endpoints/Bar/VerEmpleadosBar.png)
- [Ver pedidos del bar](Insomnia-pruebas/Capturas-Endpoints/Bar/VerPedidosBar.png)

### Pruebas denegadas

Estas pruebas comprueban que la API rechaza las peticiones incorrectas con el código y el mensaje adecuados. Ninguna modifica datos, así que se pueden repetir sin volver a ejecutar el seed. Las capturas están en la subcarpeta `Denegadas/` de cada recurso.

| Recurso | Prueba | Petición | Respuesta | Captura |
|---|---|---|---|---|
| Usuarios | Login con contraseña incorrecta | `POST /api/usuarios/login` | `401` Usuario o contraseña incorrectos | [Ver](Insomnia-pruebas/Capturas-Endpoints/Usuarios/Denegadas/LoginFallido.png) |
| Usuarios | Registro sin el campo `nombre` | `POST /api/usuarios/registro` | `400` error al registrar usuario (`nombre` es obligatorio) | [Ver](Insomnia-pruebas/Capturas-Endpoints/Usuarios/Denegadas/RegistroSinCampos.png) |
| Usuarios | Cambiar un rol sin ser encargado | `PATCH /api/usuarios/:id/rol` | `403` Solo los encargados pueden acceder a esta ruta | [Ver](Insomnia-pruebas/Capturas-Endpoints/Usuarios/Denegadas/ProhibidoCambioRole.png) |
| Pedidos | Pedido sin productos | `POST /api/pedidos` | `400` No se proporcionaron productos para el pedido | [Ver](Insomnia-pruebas/Capturas-Endpoints/Pedidos/Denegadas/PedidoVacio.png) |
| Pedidos | Pedido para un bar al que no pertenece el empleado | `POST /api/pedidos` | `403` No perteneces a ese bar | [Ver](Insomnia-pruebas/Capturas-Endpoints/Pedidos/Denegadas/PedidoAOtroBar.png) |
| Proveedores | ID con formato no válido | `GET /api/proveedores/123` | `400` ID de proveedor no válido | [Ver](Insomnia-pruebas/Capturas-Endpoints/Proveedor/Denegadas/ProveedorIDNovalido.png) |
| Proveedores | Un proveedor edita otra empresa | `PATCH /api/proveedores/:id` | `403` Solo puedes editar tu propio proveedor | [Ver](Insomnia-pruebas/Capturas-Endpoints/Proveedor/Denegadas/ProveedorEditaOtro.png) |
| Proveedores | Editar sin enviar ningún campo | `PATCH /api/proveedores/:id` | `400` No hay nada que actualizar | [Ver](Insomnia-pruebas/Capturas-Endpoints/Proveedor/Denegadas/EditarProveedorVacio.png) |
| Productos | Crear un producto sin imagen | `POST /api/productos` | `400` Se requiere una imagen para el producto | [Ver](Insomnia-pruebas/Capturas-Endpoints/Productos/Denegadas/ProductoSinImagen.png) |
| Productos | Crear un producto siendo empleado | `POST /api/productos` | `403` Roles permitidos: proveedor, encargado | [Ver](Insomnia-pruebas/Capturas-Endpoints/Productos/Denegadas/ProductoSinPermiso.png) |
| Bares | Renombrar un bar sin nombre | `PATCH /api/bares/:id` | `400` El campo nombre es obligatorio | [Ver](Insomnia-pruebas/Capturas-Endpoints/Bar/Denegadas/BarNombreObligatorio.png) |
| Bares | Añadir un empleado a un bar de otro encargado | `POST /api/bares/:id/empleados` | `403` No eres el encargado de este bar | [Ver](Insomnia-pruebas/Capturas-Endpoints/Bar/Denegadas/BarPermisosAñadir.png) |
| Bares | Añadir a un usuario que no es empleado | `POST /api/bares/:id/empleados` | `400` Solo se pueden añadir usuarios con rol empleado | [Ver](Insomnia-pruebas/Capturas-Endpoints/Bar/Denegadas/BaresNoEmpleados.png) |

---

## Diagramas

La carpeta [`Diagramas/`](Diagramas) contiene el diseño del proyecto:

- [Diagrama de clases](Diagramas/DiagramaDeClasesV2.png)
- [Diagrama de casos de uso](Diagramas/DiagramaDeCasosDeUsoV2.png)
- [Diagrama de estados](Diagramas/DiagramaDeEstadosV2.png)
- [Diagrama de secuencia](Diagramas/DiagramaDeSecuenciaV2.png)
- [Diagrama de Gantt](Diagramas/DiagramaGanttV2.png)

---

## Próximos pasos

- [ ] Frontend en **React** ([Suppli-TFG-FRONTEND](https://github.com/JorgeSanchezGallego/Suppli-TFG-FRONTEND)), en curso:
  - [x] Landing, página "Quiénes somos", login, registro y sesión con JWT
  - [ ] Catálogo visual, carrito de compra y panel de pedidos
- [ ] Envío automático del pedido al proveedor por **WhatsApp** (generación de la URL de WhatsApp Web)
- [x] Gestión de **bares** desde la API (crear, renombrar, borrar y asignar empleados)
- [x] CRUD completo de **proveedores** desde la API
- [x] Gestión del **estado** de los pedidos (`pendiente` → `entregado`)

---

## Autor

**Jorge Sánchez Gallego**: TFG del ciclo de Desarrollo de Aplicaciones Web
Tutor: José Manuel Villar Ferradal
