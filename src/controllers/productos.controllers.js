const mongoose = require('mongoose');
const Producto = require('../models/producto.model');
const Proveedor = require('../models/proveedor.model');
const {borrarImagenCloudinary} = require('../utils/cloudinary.utils');
const {regexBusqueda} = require('../utils/regex');

const filtroAcceso = (user) => {
    if (user.role !== 'proveedor') {
        return {};
    }
    if (!user.proveedor) {
        return null;
    }
    return {proveedor: user.proveedor};
};

const SIN_EMPRESA = {error: "El usuario no está vinculado a ningún proveedor"};

const borrarImagenSubida = (req) => {
    if (req.file && req.file.path) {
        borrarImagenCloudinary(req.file.path);
    }
};

const proveedorValido = async (proveedor) => {
    return mongoose.Types.ObjectId.isValid(proveedor) && await Proveedor.exists({_id: proveedor});
};

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

const verProductos = async (req, res) => {
    try {
        await buscar(req, res, {});
    } catch (error) {
        res.status(400).json({error: "error al obtener productos", details: error.message});
    }
};

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
        if (error.code === 11000) {
            return res.status(409).json({error: "El producto ya existe"});
        }
        res.status(400).json({error: "error al crear producto", details: error.message});
    }
};

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

const buscarProductoPorNombre = async (req, res) => {
    try {
        await buscar(req, res, {nombre: regexBusqueda(req.params.nombre)});
    } catch (error) {
        res.status(400).json({error: "error al buscar producto", details: error.message});
    }
};

const buscarProductoPorCategoria = async (req, res) => {
    try {
        await buscar(req, res, {categoria: regexBusqueda(req.params.categoria)});
    } catch (error) {
        res.status(400).json({error: "error al buscar producto", details: error.message});
    }
};

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
