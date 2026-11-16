const mongoose = require('mongoose');
const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');

const crearPedido = async (req, res) => {
    try {
        const {productos, proveedor} = req.body;

        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({error: "No se proporcionaron productos para el pedido"});
        }

        if(!proveedor || !mongoose.Types.ObjectId.isValid(proveedor)) {
            return res.status(400).json({error: "El campo proveedor es obligatorio y debe ser un ID válido"});
        }

        if (!req.user || !req.user.bar) {
            return res.status(400).json({error: "El usuario no tiene un bar asignado"});
        }
        
        let proveedorID = proveedor;
        const productosConPrecio = await Promise.all(productos.map(async (item) => {
            if (!item.producto || !mongoose.Types.ObjectId.isValid(item.producto)) {
                throw new Error(`Producto con ID ${item.producto} no es válido`);
            }
            if (typeof item.cantidad !== 'number' || item.cantidad < 1) {
                throw new Error(`Cantidad para el producto con ID ${item.producto} no es válida`);
            }
            const productoDB = await Producto.findById(item.producto);
            if (!productoDB) {
                throw new Error(`Producto con ID ${item.producto} no encontrado`);
            }
            return { producto: item.producto, nombre: productoDB.nombre, cantidad: item.cantidad, precioUnitario: productoDB.precio };
        }));
        if (!proveedorID) {
            return res.status(400).json({ error: "El campo proveedor es obligatorio para crear el pedido" });
        }

        const totalCalculado = productosConPrecio.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
        const totalRedondeado = Math.round(totalCalculado * 100) / 100;
        const nuevoPedido = new Pedido({
            usuario: req.user._id,
            proveedor: proveedorID,
            bar: req.user.bar,
            productos: productosConPrecio,
            total: totalRedondeado
        });
        const pedidoGuardado = await nuevoPedido.save();
        await pedidoGuardado.populate('productos.producto');
        res.status(201).json({ message: "Pedido realizado con éxito", pedido: pedidoGuardado });
    } catch (error) {
        res.status(400).json({error: "error al crear pedido", details: error.message});
    }
}

const verPedidos = async (req, res) => {
    try {
        // El encargado ve los pedidos de su bar; el proveedor, los que le han hecho a su empresa
        let filtro;
        if (req.user.role === 'encargado') {
            if (!req.user.bar) {
                return res.status(400).json({error: "El encargado no tiene un bar asignado"});
            }
            filtro = {bar: req.user.bar};
        } else if (req.user.role === 'proveedor') {
            if (!req.user.proveedor) {
                return res.status(400).json({error: "El usuario no está vinculado a ningún proveedor"});
            }
            filtro = {proveedor: req.user.proveedor};
        } else {
            return res.status(403).json({error: "Acceso denegado"});
        }

        const pedidos = await Pedido.find(filtro)
            .populate('productos.producto')
            .populate('usuario', 'nombre apellidos')
            .populate('bar', 'nombre ubicacion')
            .sort({createdAt: -1});
        return res.status(200).json(pedidos);
    } catch (error) {
        return res.status(500).json({error: "error al obtener pedidos", details: error.message});
    }
};

module.exports = {crearPedido, verPedidos};