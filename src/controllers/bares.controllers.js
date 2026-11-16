const mongoose = require('mongoose');
const Bar = require('../models/bar.model');
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');

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

const verMisBares = async (req, res) => {
    try {
        const bares = await Bar.find({encargado: req.user._id}).sort({createdAt: -1});
        res.status(200).json(bares);
    } catch (error) {
        res.status(400).json({error: "error al obtener los bares", details: error.message});
    }
};

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
