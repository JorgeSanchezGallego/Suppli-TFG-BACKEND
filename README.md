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
│   ├── controllers/      # Lógica de cada recurso (usuarios, productos, pedidos, bares)
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

> **Nota:** para registrar un usuario hace falta indicar el `_id` de un **Bar** existente. Por ahora la API no tiene endpoint para crear bares ni proveedores, así que esos documentos deben insertarse primero a mano en la base de datos (con MongoDB Compass, Atlas o `mongosh`).

---

## Modelo de datos

| Modelo | Campos principales |
|---|---|
| **Usuario** | `nombre`, `apellidos`, `bar` (ref. Bar), `fechaNacimiento`, `residencia`, `correo` (único), `contraseña` (hash bcrypt, mín. 8 caracteres), `telefono`, `role` (`encargado` · `empleado` · `proveedor`) |
| **Bar** | `nombre`, `ubicacion` |
| **Proveedor** | `nombre_empresa`, `nombre_persona`, `telefono`, `dias_reparto` |
| **Producto** | `proveedor` (ref. Proveedor), `nombre`, `precio`, `medida`, `stock_optimo_invierno`, `stock_optimo_verano`, `categoria` |
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
| POST | `/registro` | Público | Registra un nuevo usuario |
| POST | `/login` | Público | Inicia sesión y devuelve `{ user, token }` |

### Productos — `/api/productos`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Empleado / Encargado | Lista todos los productos |
| GET | `/buscar/nombre/:nombre` | Empleado / Encargado | Busca productos por nombre |
| GET | `/buscar/categoria/:categoria` | Empleado / Encargado | Busca productos por categoría |
| GET | `/buscar/proveedor/:proveedor` | Empleado / Encargado | Busca productos por proveedor |
| POST | `/` | Proveedor / Encargado | Crea un producto (`multipart/form-data`, campo de imagen `imagen`) |
| PATCH | `/:id` | Proveedor / Encargado | Actualiza un producto (admite nueva `imagen`) |
| DELETE | `/:id` | Proveedor / Encargado | Elimina un producto |

### Pedidos — `/api/pedidos`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/` | Empleado | Crea un pedido para el bar del usuario |
| GET | `/historial` | Encargado / Proveedor | Historial de pedidos |

Ejemplo de cuerpo para crear un pedido:

```json
{
  "proveedor": "<id_proveedor>",
  "productos": [
    { "producto": "<id_producto>", "cantidad": 3 },
    { "producto": "<id_producto>", "cantidad": 1 }
  ]
}
```

### Bares — `/api/bares`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/:id/pedidos` | Encargado | Pedidos de un bar |
| GET | `/:id/empleados` | Encargado | Empleados de un bar |

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
- [ ] CRUD completo de **proveedores** y **bares** desde la API
- [ ] Gestión del **estado** de los pedidos (`pendiente` → `enviado` → `entregado`)

---

## Autor

**Jorge Sánchez Gallego**: TFG del ciclo de Desarrollo de Aplicaciones Web
Tutor: José Manuel Villar Ferradal
