const mongoose = require('mongoose');
const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');
const Bar = require('../models/bar.model');
const Proveedor = require('../models/proveedor.model');

const crearPedido = async (req, res) => {
    try {
        const {productos, proveedor, bar} = req.body;

        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({error: "No se proporcionaron productos para el pedido"});
        }

        if(!proveedor || !mongoose.Types.ObjectId.isValid(proveedor)) {
            return res.status(400).json({error: "El campo proveedor es obligatorio y debe ser un ID válido"});
        }

        if (!bar || !mongoose.Types.ObjectId.isValid(bar)) {
            return res.status(400).json({error: "El campo bar es obligatorio y debe ser un ID válido"});
        }

        if (!req.user.bares.some((barId) => barId.equals(bar))) {
            return res.status(403).json({error: "No perteneces a ese bar"});
        }

        if (!(await Proveedor.exists({_id: proveedor}))) {
            return res.status(404).json({error: "Proveedor no encontrado"});
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
            if (!productoDB.proveedor || !productoDB.proveedor.equals(proveedor)) {
                throw new Error(`El producto "${productoDB.nombre}" no pertenece al proveedor del pedido`);
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
            bar,
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
        let filtro;
        if (req.user.role === 'encargado') {
            const misBares = await Bar.find({encargado: req.user._id}).select('_id');
            const idsBares = misBares.map((b) => b._id);
            const {bar} = req.query;
            if (bar) {
                if (!mongoose.Types.ObjectId.isValid(bar) || !idsBares.some((id) => id.equals(bar))) {
                    return res.status(403).json({error: "No eres el encargado de ese bar"});
                }
                filtro = {bar};
            } else {
                filtro = {bar: {$in: idsBares}};
            }
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

const SIGUIENTE_ESTADO = {
    pendiente: 'enviado',
    enviado: 'entregado'
};

const cambiarEstadoPedido = async (req, res) => {
    try {
        const {id} = req.params;
        const {estado} = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({error: "ID de pedido no válido"});
        }
        if (!['enviado', 'entregado'].includes(estado)) {
            return res.status(400).json({error: "Estado no válido. Estados posibles: enviado, entregado"});
        }

        const pedido = await Pedido.findById(id);
        if (!pedido) {
            return res.status(404).json({error: "Pedido no encontrado"});
        }

        const bar = await Bar.findById(pedido.bar).select('encargado');
        const esEncargadoDelBar = req.user.role === 'encargado' && bar && bar.encargado.equals(req.user._id);
        const esEmpleadoDelBar = req.user.role === 'empleado' && req.user.bares.some((barId) => barId.equals(pedido.bar));
        const esProveedorDelPedido = req.user.role === 'proveedor' && req.user.proveedor && req.user.proveedor.equals(pedido.proveedor);

        if (!esEncargadoDelBar && !esEmpleadoDelBar && !esProveedorDelPedido) {
            return res.status(404).json({error: "Pedido no encontrado"});
        }

        if (SIGUIENTE_ESTADO[pedido.estado] !== estado) {
            return res.status(400).json({
                error: pedido.estado === 'entregado'
                    ? "El pedido ya está entregado y no se puede modificar"
                    : `Un pedido ${pedido.estado} solo puede pasar a ${SIGUIENTE_ESTADO[pedido.estado]}`
            });
        }

        const puedeCambiar = estado === 'enviado'
            ? esProveedorDelPedido || esEncargadoDelBar
            : esEncargadoDelBar || esEmpleadoDelBar;
        if (!puedeCambiar) {
            return res.status(403).json({
                error: estado === 'enviado'
                    ? "Solo el proveedor del pedido o el encargado del bar pueden marcarlo como enviado"
                    : "Solo el encargado o los empleados del bar pueden marcarlo como entregado"
            });
        }

        pedido.estado = estado;
        const actualizado = await pedido.save();
        await actualizado.populate([
            {path: 'bar', select: 'nombre ubicacion'},
            {path: 'usuario', select: 'nombre apellidos'}
        ]);
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(400).json({error: "error al cambiar el estado del pedido", details: error.message});
    }
};

module.exports = {crearPedido, verPedidos, cambiarEstadoPedido};