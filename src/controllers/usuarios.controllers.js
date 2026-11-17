const mongoose = require('mongoose');
const Usuario = require('../models/usuario.model');
const Bar = require('../models/bar.model');
const Proveedor = require('../models/proveedor.model');
const bcrypt = require('bcrypt');
const {generarToken} = require('../utils/token');
const {regexBusqueda} = require('../utils/regex');

/**
 * Roles que puede tener un usuario.
 * @type {string[]}
 */
const ROLES = ['empleado', 'encargado', 'proveedor'];

/**
 * Registra un nuevo usuario.
 * Todos los usuarios se registran con el rol `empleado` y sin bares: los campos
 * `role`, `proveedor` y `bares` del cuerpo se ignoran, porque solo un encargado
 * puede cambiarlos después.
 *
 * Ruta: `POST /api/usuarios/registro` (pública).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del usuario: `nombre`, `apellidos`, `fechaNacimiento`,
 *   `residencia`, `correo`, `contraseña` (mínimo 8 caracteres) y `telefono`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con el usuario creado (con la contraseña a `null`),
 *   o `400` si el correo ya está registrado o falta algún dato obligatorio.
 */
const registrarUsuario = async (req, res) => {
    try {
        const {bares, role, proveedor, ...datos} = req.body;
        const user = new Usuario({...datos, role: 'empleado'});
        const userExistente = await Usuario.findOne({correo: user.correo});
        if (userExistente) {
            return res.status(400).json({error: 'El usuario ya está registrado'});
        }

        const userGuardado = await user.save();
        userGuardado.contraseña = null;
        res.status(201).json(userGuardado);
    } catch (error) {
        res.status(400).json({error: "error al registrar usuario", details: error.message});
    }
};

/**
 * Inicia sesión con correo y contraseña.
 * Compara la contraseña con el hash guardado (bcrypt) y, si es correcta, genera un
 * token JWT válido durante 1 día. Si el correo no existe o la contraseña no coincide,
 * devuelve el mismo mensaje para no revelar qué correos están registrados.
 *
 * Ruta: `POST /api/usuarios/login` (pública).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Credenciales: `correo` y `contraseña`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con `{ user, token }` (el usuario sin contraseña),
 *   o `401` si las credenciales no son correctas.
 */
const loginUsuario = async (req, res) => {
    try {
        const {correo, contraseña} = req.body;
        const user = await Usuario.findOne({correo});
        if (!user) {
            return res.status(401).json({error: 'Usuario o contraseña incorrectos'});
        }
        const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);
        if (!contraseñaValida) {
            return res.status(401).json({error: 'Usuario o contraseña incorrectos'});
        }
        const token = generarToken(user._id, user.correo);
        user.contraseña = null;
        res.status(200).json({user, token});
    } catch (error) {
        res.status(400).json({error: "error al iniciar sesión", details: error.message});
    }
};

/**
 * Lista los usuarios, con filtros opcionales por nombre y por rol.
 * El filtro `nombre` busca el texto en el nombre y en los apellidos, sin distinguir
 * mayúsculas. Cada usuario se devuelve sin contraseña, con sus bares (nombre y
 * ubicación) y, si es proveedor, con el nombre de su empresa.
 *
 * Ruta: `GET /api/usuarios` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.query - Filtros opcionales.
 * @param {string} [req.query.nombre] - Texto a buscar en el nombre o los apellidos.
 * @param {string} [req.query.role] - Rol: `empleado`, `encargado` o `proveedor`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de usuarios ordenada por nombre,
 *   o `400` si el rol indicado no existe.
 */
const buscarUsuarios = async (req, res) => {
    try {
        const filtro = {};
        const {nombre, role} = req.query;
        if (typeof nombre === 'string' && nombre.trim() !== '') {
            const regex = regexBusqueda(nombre);
            filtro.$or = [{nombre: regex}, {apellidos: regex}];
        }
        if (role !== undefined) {
            if (!ROLES.includes(role)) {
                return res.status(400).json({error: `Rol no válido. Roles posibles: ${ROLES.join(', ')}`});
            }
            filtro.role = role;
        }
        const usuarios = await Usuario.find(filtro)
            .select('-contraseña')
            .populate('bares', 'nombre ubicacion')
            .populate('proveedor', 'nombre_empresa')
            .sort({nombre: 1, apellidos: 1});
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(400).json({error: "error al buscar usuarios", details: error.message});
    }
};

/**
 * Cambia el rol de un usuario.
 * Reglas:
 * - Un encargado no puede cambiar su propio rol.
 * - Un encargado que todavía tiene bares no puede dejar de ser encargado.
 * - Para el rol `proveedor` hay que indicar una empresa proveedora existente.
 * - Al dejar de ser `proveedor`, el usuario se desvincula de su empresa.
 * - Al pasar a `encargado` o `proveedor`, el usuario deja de pertenecer a sus bares.
 *
 * Ruta: `PATCH /api/usuarios/:id/rol` (solo encargados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del usuario al que se le cambia el rol.
 * @param {Object} req.body - Nuevo rol.
 * @param {string} req.body.role - `empleado`, `encargado` o `proveedor`.
 * @param {string} [req.body.proveedor] - ID de la empresa proveedora (obligatorio si `role` es `proveedor`).
 * @param {Object} req.user - Encargado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el usuario actualizado (sin contraseña);
 *   `400` si el ID o el rol no son válidos, si falta el proveedor, si el encargado
 *   intenta cambiar su propio rol o si el usuario es un encargado con bares;
 *   `404` si el usuario o el proveedor no existen.
 */
const cambiarRol = async (req, res) => {
    try {
        const {id} = req.params;
        const {role, proveedor} = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({error: "ID de usuario no válido"});
        }
        if (!ROLES.includes(role)) {
            return res.status(400).json({error: `Rol no válido. Roles posibles: ${ROLES.join(', ')}`});
        }
        if (req.user._id.equals(id)) {
            return res.status(400).json({error: "No puedes cambiar tu propio rol"});
        }
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({error: "Usuario no encontrado"});
        }

        if (usuario.role === 'encargado' && role !== 'encargado') {
            const numBares = await Bar.countDocuments({encargado: usuario._id});
            if (numBares > 0) {
                return res.status(400).json({error: `Este encargado tiene ${numBares} bar(es); hay que borrarlos antes de cambiarle el rol`});
            }
        }

        if (role === 'proveedor') {
            if (!proveedor || !mongoose.Types.ObjectId.isValid(proveedor)) {
                return res.status(400).json({error: "Para el rol proveedor hay que indicar el ID de su proveedor"});
            }
            if (!(await Proveedor.exists({_id: proveedor}))) {
                return res.status(404).json({error: "Proveedor no encontrado"});
            }
            usuario.proveedor = proveedor;
        } else {
            usuario.proveedor = undefined;
        }

        if (role !== 'empleado') {
            usuario.bares = [];
        }

        usuario.role = role;
        const guardado = await usuario.save();
        guardado.contraseña = undefined;
        res.status(200).json(guardado);
    } catch (error) {
        res.status(400).json({error: "error al cambiar el rol", details: error.message});
    }
};

module.exports = {registrarUsuario, loginUsuario, buscarUsuarios, cambiarRol};
