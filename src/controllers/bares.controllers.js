const mongoose = require('mongoose');
const Bar = require('../models/bar.model');
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');

/**
 * Middleware que carga el bar de la ruta y comprueba que es del encargado autenticado.
 * Si todo es correcto, deja el bar en `req.bar` para el siguiente controlador.
 * Lo usan todas las rutas de `/api/bares/:id`.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del bar.
 * @param {Object} req.user - Encargado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
 * @returns {Promise<void>} Llama a `next()` si el bar es del encargado; si no, responde
 *   `400` si el ID no es válido, `403` si el bar es de otro encargado o `404` si no existe.
 */
const cargarBarPropio = async (req, res, next) => {
    try {
        const barId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(barId)) {
            return res.status(400).json({error: "ID de bar no válido"});
        }
        const bar = await Bar.findById(barId);
        if (!bar) {
            return res.status(404).json({error: "Bar no encontrado"});
        }
        if (!bar.encargado.equals(req.user._id)) {
            return res.status(403).json({error: "No eres el encargado de este bar"});
        }
        req.bar = bar;
        next();
    } catch (error) {
        res.status(400).json({error: "error al obtener el bar", details: error.message});
    }
};

/**
 * Crea un bar. El encargado autenticado queda como su único encargado.
 *
 * Ruta: `POST /api/bares` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del bar.
 * @param {string} req.body.nombre - Nombre del bar.
 * @param {string} req.body.ubicacion - Ubicación del bar (no se podrá cambiar después).
 * @param {Object} req.user - Encargado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con el bar creado, o `400` si falta el nombre o la ubicación.
 */
const crearBar = async (req, res) => {
    try {
        const {nombre, ubicacion} = req.body;
        const bar = new Bar({nombre, ubicacion, encargado: req.user._id});
        const barGuardado = await bar.save();
        res.status(201).json(barGuardado);
    } catch (error) {
        res.status(400).json({error: "error al crear el bar", details: error.message});
    }
};

/**
 * Lista los bares del encargado autenticado, del más reciente al más antiguo.
 *
 * Ruta: `GET /api/bares` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.user - Encargado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de bares (puede estar vacía).
 */
const verMisBares = async (req, res) => {
    try {
        const bares = await Bar.find({encargado: req.user._id}).sort({createdAt: -1});
        res.status(200).json(bares);
    } catch (error) {
        res.status(400).json({error: "error al obtener los bares", details: error.message});
    }
};

/**
 * Cambia el nombre de un bar. Es lo único que se puede editar: la ubicación y el
 * encargado son fijos, y si vienen en el cuerpo se ignoran.
 *
 * Ruta: `PATCH /api/bares/:id` (solo el encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos a cambiar.
 * @param {string} req.body.nombre - Nuevo nombre del bar.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el bar actualizado, o `400` si el nombre está vacío.
 */
const editarBar = async (req, res) => {
    try {
        const {nombre} = req.body;
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({error: "El campo nombre es obligatorio"});
        }
        req.bar.nombre = nombre;
        const barActualizado = await req.bar.save();
        res.status(200).json(barActualizado);
    } catch (error) {
        res.status(400).json({error: "error al editar el bar", details: error.message});
    }
};

/**
 * Borra un bar en cascada: elimina también sus pedidos y lo quita de la lista de
 * bares de sus empleados.
 *
 * Ruta: `DELETE /api/bares/:id` (solo el encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con `{ message, pedidosBorrados }`.
 */
const borrarBar = async (req, res) => {
    try {
        const barId = req.bar._id;
        const {deletedCount: pedidosBorrados} = await Pedido.deleteMany({bar: barId});
        await Usuario.updateMany({bares: barId}, {$pull: {bares: barId}});
        await req.bar.deleteOne();
        res.status(200).json({message: "Bar eliminado", pedidosBorrados});
    } catch (error) {
        res.status(400).json({error: "error al borrar el bar", details: error.message});
    }
};

/**
 * Añade un empleado a un bar. Si ya pertenecía al bar, no se duplica.
 * Solo se pueden añadir usuarios con rol `empleado`.
 *
 * Ruta: `POST /api/bares/:id/empleados` (solo el encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del empleado.
 * @param {string} req.body.usuarioId - ID del usuario que se añade al bar.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el usuario actualizado (sin contraseña);
 *   `400` si falta el ID, no es válido o el usuario no es empleado;
 *   `404` si el usuario no existe.
 */
const añadirEmpleado = async (req, res) => {
    try {
        const {usuarioId} = req.body;
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({error: "El campo usuarioId es obligatorio y debe ser un ID válido"});
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        if (usuario.role !== 'empleado') {
            return res.status(400).json({error: "Solo se pueden añadir usuarios con rol empleado"});
        }
        const actualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            {$addToSet: {bares: req.bar._id}},
            {returnDocument: 'after'}
        ).select('-contraseña');
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(400).json({error: "error al añadir el empleado", details: error.message});
    }
};

/**
 * Quita un empleado de un bar.
 *
 * Ruta: `DELETE /api/bares/:id/empleados/:usuarioId` (solo el encargado del bar,
 * comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.usuarioId - ID del usuario que se quita del bar.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el usuario actualizado (sin contraseña);
 *   `400` si el ID no es válido; `404` si el usuario no pertenece al bar.
 */
const quitarEmpleado = async (req, res) => {
    try {
        const {usuarioId} = req.params;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({error: "ID de usuario no válido"});
        }
        const actualizado = await Usuario.findOneAndUpdate(
            {_id: usuarioId, bares: req.bar._id},
            {$pull: {bares: req.bar._id}},
            {returnDocument: 'after'}
        ).select('-contraseña');
        if (!actualizado) {
            return res.status(404).json({error: "El usuario no pertenece a este bar"});
        }
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(400).json({error: "error al quitar el empleado", details: error.message});
    }
};

/**
 * Lista los pedidos de un bar, del más reciente al más antiguo, con el usuario que
 * hizo cada pedido y los datos de sus productos.
 *
 * Ruta: `GET /api/bares/:id/pedidos` (solo el encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de pedidos (puede estar vacía).
 */
const verPedidosBar = async (req, res) => {
    try {
        const pedidos = await Pedido.find({bar: req.bar._id})
            .populate('usuario', 'nombre apellidos')
            .populate('productos.producto')
            .sort({createdAt: -1});
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(400).json({error: "error al obtener pedidos del bar", details: error.message});
    }
};

/**
 * Lista los empleados que trabajan en un bar, sin su contraseña.
 *
 * Ruta: `GET /api/bares/:id/empleados` (solo el encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de empleados (puede estar vacía).
 */
const verEmpleadosBar = async (req, res) => {
    try {
        const empleados = await Usuario.find({bares: req.bar._id}).select('-contraseña');
        res.status(200).json(empleados);
    } catch (error) {
        res.status(400).json({error: "error al obtener empleados del bar", details: error.message});
    }
};

module.exports = {
    cargarBarPropio,
    crearBar,
    verMisBares,
    editarBar,
    borrarBar,
    añadirEmpleado,
    quitarEmpleado,
    verPedidosBar,
    verEmpleadosBar
};
