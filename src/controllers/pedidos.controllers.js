const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');

const crearPedido = async (req, res) => {
    try {
        const {productos, proveedor} = req.body;
        if (!productos || productos.length === 0) {
            return res.status(400).json({error: "No se proporcionaron productos para el pedido"});
        }
        let proveedorID = proveedor;
        const productosConPrecio = await Promise.all(productos.map(async (item) => {
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
        res.status(500).json({error: "error al crear pedido", details: error.message});
    }
}

const verPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find({usuario: req.user._id}).populate('productos.producto').sort({createdAt: -1});
        return res.status(200).json(pedidos);
    } catch (error) {
        return res.status(500).json({error: "error al obtener pedidos", details: error.message});
    }
};

module.exports = {crearPedido, verPedidos};