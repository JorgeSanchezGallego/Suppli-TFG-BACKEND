const mongoose = require('mongoose');
const Bar = require('../models/bar.model');
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');

/**
 * Middleware que carga el bar de la ruta y comprueba que el usuario autenticado es uno de sus encargados.
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
 * @returns {Promise<void>} Llama a `next()` si el usuario es uno de los encargados del bar;
 *   si no, responde `400` si el ID no es válido, `403` si no es encargado de ese bar o `404`
 *   si no existe.
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
        if (!bar.encargados.some((id) => id.equals(req.user._id))) {
            return res.status(403).json({error: "No eres el encargado de este bar"});
        }
        req.bar = bar;
        next();
    } catch (error) {
        res.status(400).json({error: "error al obtener el bar", details: error.message});
    }
};

/**
 * Borra de Cloudinary la foto que se acaba de subir en esta petición. Se usa cuando
 * la operación falla, para que no queden imágenes sueltas en Cloudinary.
 *
 * @param {import('express').Request} req - Petición de Express (con `req.file` si se subió una foto).
 * @returns {void}
 */
const borrarFotoSubida = (req) => {
    if (req.file && req.file.path) {
        borrarImagenCloudinary(req.file.path);
    }
};

/**
 * Crea un bar. El encargado autenticado queda como su primer encargado (después se
 * pueden añadir más con `POST /api/bares/:id/encargados`). La foto es
 * opcional: si se envía (campo `imagen` de un `multipart/form-data`), la sube a
 * Cloudinary el middleware `subidaBar` antes de llegar aquí.
 *
 * Ruta: `POST /api/bares` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del bar.
 * @param {string} req.body.nombre - Nombre del bar.
 * @param {string} req.body.ubicacion - Ubicación del bar (no se podrá cambiar después).
 * @param {Object} [req.file] - Foto del bar subida a Cloudinary (opcional).
 * @param {Object} req.user - Encargado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con el bar creado, o `400` si falta el nombre o la ubicación.
 */
const crearBar = async (req, res) => {
    try {
        const {nombre, ubicacion} = req.body;
        const bar = new Bar({nombre, ubicacion, encargados: [req.user._id], imagen: req.file?.path});
        const barGuardado = await bar.save();
        res.status(201).json(barGuardado);
    } catch (error) {
        borrarFotoSubida(req);
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
        const bares = await Bar.find({encargados: req.user._id})
            .populate('encargados', 'nombre apellidos correo telefono')
            .sort({createdAt: -1});
        res.status(200).json(bares);
    } catch (error) {
        res.status(400).json({error: "error al obtener los bares", details: error.message});
    }
};

/**
 * Edita un bar: se puede cambiar el nombre, la foto o las dos cosas. La ubicación y el
 * encargado son fijos, y si vienen en el cuerpo se ignoran. Si se sube una foto nueva,
 * la anterior se borra de Cloudinary.
 *
 * Ruta: `PATCH /api/bares/:id` (solo los encargados del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos a cambiar.
 * @param {string} [req.body.nombre] - Nuevo nombre del bar.
 * @param {Object} [req.file] - Nueva foto del bar subida a Cloudinary.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el bar actualizado, o `400` si no llega ni nombre
 *   ni foto, o si el nombre está vacío.
 */
const editarBar = async (req, res) => {
    try {
        const {nombre} = req.body;
        if (nombre === undefined && !req.file) {
            return res.status(400).json({error: "No hay nada que actualizar. Envía un nombre o una foto"});
        }
        if (nombre !== undefined) {
            if (typeof nombre !== 'string' || nombre.trim() === '') {
                borrarFotoSubida(req);
                return res.status(400).json({error: "El campo nombre es obligatorio"});
            }
            req.bar.nombre = nombre;
        }
        const fotoAnterior = req.bar.imagen;
        if (req.file) {
            req.bar.imagen = req.file.path;
        }
        const barActualizado = await req.bar.save();
        if (req.file && fotoAnterior) {
            borrarImagenCloudinary(fotoAnterior);
        }
        res.status(200).json(barActualizado);
    } catch (error) {
        borrarFotoSubida(req);
        res.status(400).json({error: "error al editar el bar", details: error.message});
    }
};

/**
 * Borra un bar en cascada: elimina también sus pedidos, lo quita de la lista de
 * bares de sus empleados y borra su foto de Cloudinary si tenía.
 *
 * Ruta: `DELETE /api/bares/:id` (solo los encargados del bar, comprobado por `cargarBarPropio`).
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
        const foto = req.bar.imagen;
        await req.bar.deleteOne();
        if (foto) {
            borrarImagenCloudinary(foto);
        }
        res.status(200).json({message: "Bar eliminado", pedidosBorrados});
    } catch (error) {
        res.status(400).json({error: "error al borrar el bar", details: error.message});
    }
};

/**
 * Añade un empleado a un bar. Si ya pertenecía al bar, no se duplica.
 * Solo se pueden añadir usuarios con rol `empleado`.
 *
 * Ruta: `POST /api/bares/:id/empleados` (solo los encargados del bar, comprobado por `cargarBarPropio`).
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
 * Ruta: `DELETE /api/bares/:id/empleados/:usuarioId` (solo los encargados del bar,
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
 * Ruta: `GET /api/bares/:id/pedidos` (solo los encargados del bar, comprobado por `cargarBarPropio`).
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
 * Ruta: `GET /api/bares/:id/empleados` (solo los encargados del bar, comprobado por `cargarBarPropio`).
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

/**
 * Añade otro encargado a un bar. Desde ese momento puede gestionarlo igual que el
 * resto de sus encargados (empleados, nombre, foto, pedidos…).
 *
 * Ruta: `POST /api/bares/:id/encargados` (solo un encargado del bar, comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del encargado.
 * @param {string} req.body.usuarioId - ID del usuario que se añade como encargado.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el bar y sus encargados; `400` si el ID no es
 *   válido, el usuario no tiene rol `encargado` o ya es encargado del bar;
 *   `404` si el usuario no existe.
 */
const añadirEncargado = async (req, res) => {
    try {
        const {usuarioId} = req.body;
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({error: "El campo usuarioId es obligatorio y debe ser un ID válido"});
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        if (usuario.role !== 'encargado') {
            return res.status(400).json({error: "Solo se pueden añadir usuarios con rol encargado"});
        }
        if (req.bar.encargados.some((id) => id.equals(usuario._id))) {
            return res.status(400).json({error: "Este usuario ya es encargado del bar"});
        }
        req.bar.encargados.push(usuario._id);
        await req.bar.save();
        await req.bar.populate('encargados', 'nombre apellidos correo telefono');
        res.status(200).json(req.bar);
    } catch (error) {
        res.status(400).json({error: "error al añadir el encargado", details: error.message});
    }
};

/**
 * Quita a un encargado de un bar. Un encargado también puede quitarse a sí mismo para
 * dejar de gestionar el bar. Un bar no se puede quedar sin encargados: si solo queda
 * uno, hay que añadir otro antes o borrar el bar.
 *
 * Ruta: `DELETE /api/bares/:id/encargados/:usuarioId` (solo un encargado del bar,
 * comprobado por `cargarBarPropio`).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.usuarioId - ID del encargado que se quita.
 * @param {Object} req.bar - Bar cargado por `cargarBarPropio`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el bar y sus encargados; `400` si el ID no es
 *   válido o es el último encargado; `404` si el usuario no es encargado de este bar.
 */
const quitarEncargado = async (req, res) => {
    try {
        const {usuarioId} = req.params;
        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({error: "ID de usuario no válido"});
        }
        if (!req.bar.encargados.some((id) => id.equals(usuarioId))) {
            return res.status(404).json({error: "El usuario no es encargado de este bar"});
        }
        if (req.bar.encargados.length === 1) {
            return res.status(400).json({error: "Un bar no puede quedarse sin encargados. Añade otro encargado antes o borra el bar"});
        }
        req.bar.encargados = req.bar.encargados.filter((id) => !id.equals(usuarioId));
        await req.bar.save();
        await req.bar.populate('encargados', 'nombre apellidos correo telefono');
        res.status(200).json(req.bar);
    } catch (error) {
        res.status(400).json({error: "error al quitar el encargado", details: error.message});
    }
};

module.exports = {
    cargarBarPropio,
    añadirEncargado,
    quitarEncargado,
    crearBar,
    verMisBares,
    editarBar,
    borrarBar,
    añadirEmpleado,
    quitarEmpleado,
    verPedidosBar,
    verEmpleadosBar
};
