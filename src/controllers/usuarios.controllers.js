const mongoose = require('mongoose');
const Usuario = require('../models/usuario.model');
const Bar = require('../models/bar.model');
const Proveedor = require('../models/proveedor.model');
const bcrypt = require('bcrypt');
const {generarToken} = require('../utils/token');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');
const {regexBusqueda} = require('../utils/regex');

const ROLES = ['empleado', 'encargado', 'proveedor'];

const registrarUsuario = async (req, res) => {
    try {
        const {bares, role, proveedor, ...datos} = req.body;
        const user = new Usuario({...datos, role: 'empleado'});
        const userExistente = await Usuario.findOne({correo: user.correo});
        if (userExistente) {
            if (req.file) {
                await borrarImagenCloudinary(req.file.path);
            }
            return res.status(400).json({error: 'El usuario ya está registrado'});
        }
        if (req.file) {
            user.imagen = req.file.path;
        }

        const userGuardado = await user.save();
        userGuardado.contraseña = null;
        res.status(201).json(userGuardado);
    } catch (error) {
        if (req.file) {
            await borrarImagenCloudinary(req.file.path);
        }
        res.status(400).json({error: "error al registrar usuario", details: error.message});
    }
};

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
