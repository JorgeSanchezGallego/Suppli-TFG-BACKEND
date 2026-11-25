const mongoose = require('mongoose');
const Proveedor = require('../models/proveedor.model');
const Producto = require('../models/producto.model');
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');
const {regexBusqueda} = require('../utils/regex');

/**
 * Campos de un proveedor que se pueden indicar al crearlo o editarlo.
 * Cualquier otro campo del cuerpo de la petición se ignora.
 * @type {string[]}
 */
const CAMPOS = ['nombre_empresa', 'nombre_persona', 'telefono', 'dias_reparto'];

/**
 * Copia del cuerpo de la petición solo los campos permitidos (`CAMPOS`).
 *
 * @param {Object} body - Cuerpo de la petición.
 * @returns {Object} Objeto con los campos permitidos que venían en el cuerpo.
 */
const elegirCampos = (body) => {
    const datos = {};
    for (const campo of CAMPOS) {
        if (body[campo] !== undefined) {
            datos[campo] = body[campo];
        }
    }
    return datos;
};

/**
 * Middleware que carga el proveedor de la ruta y lo deja en `req.proveedor` para el
 * siguiente controlador. Lo usan las rutas de `/api/proveedores/:id`.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del proveedor.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
 * @returns {Promise<void>} Llama a `next()` si el proveedor existe; si no, responde
 *   `400` si el ID no es válido o `404` si no existe.
 */
const cargarProveedor = async (req, res, next) => {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({error: "ID de proveedor no válido"});
        }
        const proveedor = await Proveedor.findById(id);
        if (!proveedor) {
            return res.status(404).json({error: "Proveedor no encontrado"});
        }
        req.proveedor = proveedor;
        next();
    } catch (error) {
        res.status(400).json({error: "error al obtener el proveedor", details: error.message});
    }
};

/**
 * Middleware que comprueba si el usuario puede editar el proveedor cargado en
 * `req.proveedor`: el encargado puede editar cualquiera y un usuario proveedor
 * solo el de su propia empresa.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {Object} req.proveedor - Proveedor cargado por `cargarProveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
 * @returns {void} Llama a `next()` si tiene permiso; si no, responde `403`.
 */
const puedeEditarProveedor = (req, res, next) => {
    if (req.user.role === 'encargado') {
        return next();
    }
    if (req.user.role === 'proveedor' && req.user.proveedor && req.user.proveedor.equals(req.proveedor._id)) {
        return next();
    }
    return res.status(403).json({error: "Solo puedes editar tu propio proveedor"});
};

/**
 * Crea un proveedor. Los proveedores son comunes a todos los bares.
 *
 * Ruta: `POST /api/proveedores` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del proveedor.
 * @param {string} req.body.nombre_empresa - Nombre de la empresa.
 * @param {string} req.body.nombre_persona - Persona de contacto.
 * @param {string} req.body.telefono - Teléfono de contacto.
 * @param {string[]} req.body.dias_reparto - Días en los que reparte.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con el proveedor creado, o `400` si falta algún campo.
 */
const crearProveedor = async (req, res) => {
    try {
        const proveedor = new Proveedor(elegirCampos(req.body));
        const guardado = await proveedor.save();
        res.status(201).json(guardado);
    } catch (error) {
        res.status(400).json({error: "error al crear el proveedor", details: error.message});
    }
};

/**
 * Lista los proveedores ordenados por nombre de empresa, con un filtro opcional por
 * nombre (sin distinguir mayúsculas). Un usuario proveedor solo obtiene su propia
 * empresa (o una lista vacía si no está vinculado a ninguna).
 *
 * Ruta: `GET /api/proveedores` (cualquier usuario autenticado).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.query - Filtros opcionales.
 * @param {string} [req.query.nombre] - Texto a buscar en el nombre de la empresa.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de proveedores (puede estar vacía).
 */
const verProveedores = async (req, res) => {
    try {
        const filtro = {};
        if (req.user.role === 'proveedor') {
            if (!req.user.proveedor) {
                return res.status(200).json([]);
            }
            filtro._id = req.user.proveedor;
        }
        const {nombre} = req.query;
        if (typeof nombre === 'string' && nombre.trim() !== '') {
            filtro.nombre_empresa = regexBusqueda(nombre);
        }
        const proveedores = await Proveedor.find(filtro).sort({nombre_empresa: 1});
        res.status(200).json(proveedores);
    } catch (error) {
        res.status(400).json({error: "error al obtener los proveedores", details: error.message});
    }
};

/**
 * Devuelve un proveedor.
 *
 * Ruta: `GET /api/proveedores/:id` (cualquier usuario autenticado).
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.proveedor - Proveedor cargado por `cargarProveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {void} `200` con el proveedor.
 */
const verProveedor = (req, res) => {
    res.status(200).json(req.proveedor);
};

/**
 * Edita los datos de un proveedor. Solo se cambian los campos permitidos (`CAMPOS`)
 * que vengan en el cuerpo; el resto se ignoran.
 *
 * Ruta: `PATCH /api/proveedores/:id` (el encargado, o el usuario proveedor de esa
 * empresa, comprobado por `puedeEditarProveedor`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Campos a cambiar: `nombre_empresa`, `nombre_persona`,
 *   `telefono` y/o `dias_reparto`.
 * @param {Object} req.proveedor - Proveedor cargado por `cargarProveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el proveedor actualizado, o `400` si no se envía
 *   ningún campo permitido o algún valor no es válido.
 */
const editarProveedor = async (req, res) => {
    try {
        const datos = elegirCampos(req.body);
        if (Object.keys(datos).length === 0) {
            return res.status(400).json({error: `No hay nada que actualizar. Campos posibles: ${CAMPOS.join(', ')}`});
        }
        req.proveedor.set(datos);
        const actualizado = await req.proveedor.save();
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(400).json({error: "error al editar el proveedor", details: error.message});
    }
};

/**
 * Borra un proveedor en cascada: elimina sus productos (y sus imágenes de Cloudinary)
 * y sus pedidos, y los usuarios vinculados a la empresa pasan a ser empleados.
 *
 * Ruta: `DELETE /api/proveedores/:id` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.proveedor - Proveedor cargado por `cargarProveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con `{ message, productosBorrados, pedidosBorrados,
 *   usuariosActualizados }`.
 */
const borrarProveedor = async (req, res) => {
    try {
        const proveedorId = req.proveedor._id;

        const productos = await Producto.find({proveedor: proveedorId});
        for (const producto of productos) {
            if (producto.imagen) {
                borrarImagenCloudinary(producto.imagen);
            }
        }
        const {deletedCount: productosBorrados} = await Producto.deleteMany({proveedor: proveedorId});
        const {deletedCount: pedidosBorrados} = await Pedido.deleteMany({proveedor: proveedorId});
        const {modifiedCount: usuariosActualizados} = await Usuario.updateMany(
            {proveedor: proveedorId},
            {$set: {role: 'empleado'}, $unset: {proveedor: ''}}
        );
        await req.proveedor.deleteOne();

        res.status(200).json({
            message: "Proveedor eliminado",
            productosBorrados,
            pedidosBorrados,
            usuariosActualizados
        });
    } catch (error) {
        res.status(400).json({error: "error al borrar el proveedor", details: error.message});
    }
};

/**
 * Middleware que comprueba que el usuario puede ver el proveedor cargado en
 * `req.proveedor`: empleados y encargados ven cualquiera; un usuario proveedor solo
 * el de su propia empresa. Se usa después de `cargarProveedor`.
 *
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.user - Usuario autenticado.
 * @param {Object} req.proveedor - Proveedor cargado por `cargarProveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Siguiente middleware.
 * @returns {void} Llama a `next()` si puede verlo; si no, responde `403`.
 */
const puedeVerProveedor = (req, res, next) => {
    if (req.user.role !== 'proveedor') {
        return next();
    }
    if (req.user.proveedor && req.user.proveedor.equals(req.proveedor._id)) {
        return next();
    }
    return res.status(403).json({error: "Solo puedes ver los datos de tu propia empresa"});
};

module.exports = {
    cargarProveedor,
    puedeVerProveedor,
    puedeEditarProveedor,
    crearProveedor,
    verProveedores,
    verProveedor,
    editarProveedor,
    borrarProveedor
};
