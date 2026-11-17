const mongoose = require('mongoose');
const Producto = require('../models/producto.model');
const Proveedor = require('../models/proveedor.model');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');
const {regexBusqueda} = require('../utils/regex');

/**
 * Devuelve el filtro que limita qué productos puede ver o modificar un usuario:
 * empleados y encargados acceden a todos y un usuario proveedor solo a los de su empresa.
 *
 * @param {Object} user - Usuario autenticado.
 * @returns {Object|null} Filtro de Mongoose para añadir a la consulta, o `null` si el
 *   usuario es proveedor pero no está vinculado a ninguna empresa.
 */
const filtroAcceso = (user) => {
    if (user.role !== 'proveedor') {
        return {};
    }
    if (!user.proveedor) {
        return null;
    }
    return {proveedor: user.proveedor};
};

/**
 * Respuesta de error para un usuario proveedor que no está vinculado a ninguna empresa.
 * @type {{error: string}}
 */
const SIN_EMPRESA = {error: "El usuario no está vinculado a ningún proveedor"};

/**
 * Borra de Cloudinary la imagen que se acaba de subir en esta petición. Se usa cuando
 * la operación falla, para que no queden imágenes sueltas en Cloudinary.
 *
 * @param {import('express').Request} req - Petición de Express (con `req.file` si se subió una imagen).
 * @returns {void}
 */
const borrarImagenSubida = (req) => {
    if (req.file && req.file.path) {
        borrarImagenCloudinary(req.file.path);
    }
};

/**
 * Comprueba que un ID corresponde a un proveedor existente.
 *
 * @async
 * @param {string} proveedor - ID del proveedor.
 * @returns {Promise<boolean>} `true` si el ID es válido y el proveedor existe.
 */
const proveedorValido = async (proveedor) => {
    return mongoose.Types.ObjectId.isValid(proveedor) && await Proveedor.exists({_id: proveedor});
};

/**
 * Busca productos aplicando un filtro y el filtro de acceso del usuario, y envía la
 * respuesta. Los productos se devuelven ordenados por nombre, con el nombre de la
 * empresa de su proveedor. La usan el listado y todas las búsquedas.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {Object} filtroExtra - Filtro de Mongoose propio de cada búsqueda.
 * @returns {Promise<void>} `200` con la lista de productos (puede estar vacía), o `403`
 *   si el usuario es proveedor sin empresa.
 */
const buscar = async (req, res, filtroExtra) => {
    const acceso = filtroAcceso(req.user);
    if (!acceso) {
        return res.status(403).json(SIN_EMPRESA);
    }
    const productos = await Producto.find({...filtroExtra, ...acceso})
        .populate('proveedor', 'nombre_empresa')
        .sort({nombre: 1});
    return res.status(200).json(productos);
};

/**
 * Lista los productos. Un usuario proveedor solo ve los de su empresa.
 *
 * Ruta: `GET /api/productos` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de productos, o `403` si el usuario es
 *   proveedor sin empresa.
 */
const verProductos = async (req, res) => {
    try {
        await buscar(req, res, {});
    } catch (error) {
        res.status(400).json({error: "error al obtener productos", details: error.message});
    }
};

/**
 * Crea un producto. La imagen es obligatoria y la sube a Cloudinary el middleware de
 * Multer antes de llegar aquí.
 * - Un usuario proveedor siempre crea el producto para su propia empresa (el campo
 *   `proveedor` del cuerpo se ignora).
 * - El encargado tiene que indicar un `proveedor` existente.
 *
 * Si la creación falla, se borra de Cloudinary la imagen que se había subido.
 *
 * Ruta: `POST /api/productos` (proveedores y encargados), con cuerpo `multipart/form-data`.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del producto: `nombre`, `precio`, `medida`,
 *   `stock_optimo_invierno`, `stock_optimo_verano`, `categoria` y, si es el encargado,
 *   `proveedor`.
 * @param {Object} req.file - Imagen subida a Cloudinary (campo `imagen`).
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con `{ message, producto }`; `400` si falta la imagen,
 *   algún dato o el proveedor no existe; `403` si el usuario es proveedor sin empresa.
 */
const crearProducto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: "Se requiere una imagen para el producto"});
        }
        const datos = {...req.body, imagen: req.file.path};

        if (req.user.role === 'proveedor') {
            if (!req.user.proveedor) {
                borrarImagenSubida(req);
                return res.status(403).json(SIN_EMPRESA);
            }
            datos.proveedor = req.user.proveedor;
        } else if (!(await proveedorValido(datos.proveedor))) {
            borrarImagenSubida(req);
            return res.status(400).json({error: "El campo proveedor es obligatorio y debe ser un proveedor existente"});
        }

        const productoGuardado = await new Producto(datos).save();
        res.status(201).json({ message: "Producto creado con éxito", producto: productoGuardado });
    } catch (error) {
        borrarImagenSubida(req);
        res.status(400).json({error: "error al crear producto", details: error.message});
    }
};

/**
 * Actualiza un producto. Si se envía una imagen nueva, sustituye a la anterior, que se
 * borra de Cloudinary una vez guardado el cambio.
 * - Un usuario proveedor solo puede editar productos de su empresa y no puede pasarlos
 *   a otra (el campo `proveedor` se ignora).
 * - El encargado puede editar cualquier producto y cambiar su proveedor por otro existente.
 *
 * Ruta: `PATCH /api/productos/:id` (proveedores y encargados), con cuerpo JSON o
 * `multipart/form-data` si se cambia la imagen.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del producto.
 * @param {Object} req.body - Campos a cambiar.
 * @param {Object} [req.file] - Imagen nueva subida a Cloudinary (campo `imagen`).
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el producto actualizado; `400` si algún dato no
 *   es válido o el proveedor no existe; `403` si el usuario es proveedor sin empresa;
 *   `404` si el producto no existe o es de otra empresa.
 */
const actualizarProducto = async (req, res) => {
    try {
        const {id} = req.params;
        const acceso = filtroAcceso(req.user);
        if (!acceso) {
            borrarImagenSubida(req);
            return res.status(403).json(SIN_EMPRESA);
        }
        const productoExistente = mongoose.Types.ObjectId.isValid(id)
            ? await Producto.findOne({_id: id, ...acceso})
            : null;
        if (!productoExistente) {
            borrarImagenSubida(req);
            return res.status(404).json({error: "Producto no encontrado"});
        }

        const {_id, imagen, ...actualizacion} = req.body;
        if (req.user.role === 'proveedor') {
            delete actualizacion.proveedor;
        } else if (actualizacion.proveedor !== undefined && !(await proveedorValido(actualizacion.proveedor))) {
            borrarImagenSubida(req);
            return res.status(400).json({error: "El proveedor indicado no existe"});
        }
        if (req.file) {
            actualizacion.imagen = req.file.path;
        }

        const productoActualizado = await Producto.findByIdAndUpdate(id, actualizacion, {runValidators: true, returnDocument: 'after'});
        if (req.file && productoExistente.imagen) {
            borrarImagenCloudinary(productoExistente.imagen);
        }
        res.status(200).json(productoActualizado);
    } catch (error) {
        borrarImagenSubida(req);
        res.status(400).json({error: "error al actualizar producto", details: error.message});
    }
};

/**
 * Elimina un producto y borra su imagen de Cloudinary. Un usuario proveedor solo puede
 * eliminar productos de su empresa.
 *
 * Ruta: `DELETE /api/productos/:id` (proveedores y encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del producto.
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con `{ message, producto }`; `403` si el usuario es
 *   proveedor sin empresa; `404` si el producto no existe o es de otra empresa.
 */
const eliminarProducto = async (req, res) => {
    try {
        const {id} = req.params;
        const acceso = filtroAcceso(req.user);
        if (!acceso) {
            return res.status(403).json(SIN_EMPRESA);
        }
        const productoABorrar = mongoose.Types.ObjectId.isValid(id)
            ? await Producto.findOneAndDelete({_id: id, ...acceso})
            : null;
        if (!productoABorrar) {
            return res.status(404).json({error: "Producto no encontrado"});
        }
        if (productoABorrar.imagen) {
            borrarImagenCloudinary(productoABorrar.imagen);
        }
        res.status(200).json({message: "Producto eliminado con éxito", producto: productoABorrar});
    } catch (error) {
        res.status(400).json({error: "error al eliminar producto", details: error.message});
    }
};

/**
 * Busca productos cuyo nombre contenga el texto indicado (sin distinguir mayúsculas).
 *
 * Ruta: `GET /api/productos/buscar/nombre/:nombre` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.nombre - Texto a buscar en el nombre del producto.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con los productos encontrados, o `403` si el usuario
 *   es proveedor sin empresa.
 */
const buscarProductoPorNombre = async (req, res) => {
    try {
        await buscar(req, res, {nombre: regexBusqueda(req.params.nombre)});
    } catch (error) {
        res.status(400).json({error: "error al buscar producto", details: error.message});
    }
};

/**
 * Busca productos cuya categoría contenga el texto indicado (sin distinguir mayúsculas).
 *
 * Ruta: `GET /api/productos/buscar/categoria/:categoria` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.categoria - Texto a buscar en la categoría.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con los productos encontrados, o `403` si el usuario
 *   es proveedor sin empresa.
 */
const buscarProductoPorCategoria = async (req, res) => {
    try {
        await buscar(req, res, {categoria: regexBusqueda(req.params.categoria)});
    } catch (error) {
        res.status(400).json({error: "error al buscar producto", details: error.message});
    }
};

/**
 * Busca los productos de los proveedores cuyo nombre de empresa contenga el texto
 * indicado (sin distinguir mayúsculas). Un usuario proveedor solo obtiene resultados
 * de su propia empresa.
 *
 * Ruta: `GET /api/productos/buscar/proveedor/:nombre` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.nombre - Texto a buscar en el nombre de la empresa proveedora.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con los productos encontrados, o `403` si el usuario
 *   es proveedor sin empresa.
 */
const buscarProductoPorProveedor = async (req, res) => {
    try {
        const proveedores = await Proveedor.find({nombre_empresa: regexBusqueda(req.params.nombre)}).select('_id');
        const ids = proveedores.map((p) => p._id);
        await buscar(req, res, {$and: [{proveedor: {$in: ids}}]});
    } catch (error) {
        res.status(400).json({error: "error al buscar producto", details: error.message});
    }
};

module.exports = {
    verProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    buscarProductoPorNombre,
    buscarProductoPorCategoria,
    buscarProductoPorProveedor
};
