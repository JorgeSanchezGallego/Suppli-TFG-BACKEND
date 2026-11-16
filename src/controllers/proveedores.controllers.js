const mongoose = require('mongoose');
const Proveedor = require('../models/proveedor.model');
const Producto = require('../models/producto.model');
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');
const {regexBusqueda} = require('../utils/regex');

const CAMPOS = ['nombre_empresa', 'nombre_persona', 'telefono', 'dias_reparto'];

const elegirCampos = (body) => {
    const datos = {};
    for (const campo of CAMPOS) {
        if (body[campo] !== undefined) {
            datos[campo] = body[campo];
        }
    }
    return datos;
};

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

const puedeEditarProveedor = (req, res, next) => {
    if (req.user.role === 'encargado') {
        return next();
    }
    if (req.user.role === 'proveedor' && req.user.proveedor && req.user.proveedor.equals(req.proveedor._id)) {
        return next();
    }
    return res.status(403).json({error: "Solo puedes editar tu propio proveedor"});
};

const crearProveedor = async (req, res) => {
    try {
        const proveedor = new Proveedor(elegirCampos(req.body));
        const guardado = await proveedor.save();
        res.status(201).json(guardado);
    } catch (error) {
        res.status(400).json({error: "error al crear el proveedor", details: error.message});
    }
};

const verProveedores = async (req, res) => {
    try {
        const filtro = {};
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

const verProveedor = (req, res) => {
    res.status(200).json(req.proveedor);
};

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

module.exports = {
    cargarProveedor,
    puedeEditarProveedor,
    crearProveedor,
    verProveedores,
    verProveedor,
    editarProveedor,
    borrarProveedor
};
