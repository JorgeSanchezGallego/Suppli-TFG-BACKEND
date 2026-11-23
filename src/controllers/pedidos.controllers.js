const mongoose = require('mongoose');
const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');
const Bar = require('../models/bar.model');
const Proveedor = require('../models/proveedor.model');

/**
 * Crea un pedido de un empleado para uno de sus bares.
 * Comprueba que el empleado pertenece al bar, que el proveedor existe y que todos los
 * productos son de ese proveedor. El nombre y el precio de cada producto se copian
 * desde la base de datos (no se fían del cliente) y el total lo calcula el servidor,
 * así el pedido conserva el precio que tenía en el momento de hacerlo.
 *
 * Ruta: `POST /api/pedidos` (solo empleados).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.body - Datos del pedido.
 * @param {string} req.body.bar - ID del bar para el que se hace el pedido.
 * @param {string} req.body.proveedor - ID del proveedor al que se hace el pedido.
 * @param {{producto: string, cantidad: number}[]} req.body.productos - Productos y cantidades (mínimo 1 de cada).
 * @param {Object} req.user - Empleado autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `201` con el pedido creado en estado `pendiente`;
 *   `400` si faltan datos, algún ID o cantidad no es válido, un producto no existe
 *   o no es del proveedor; `403` si el empleado no pertenece al bar;
 *   `404` si el proveedor no existe.
 */
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

/**
 * Devuelve el historial de pedidos según el rol del usuario.
 * - Encargado: los pedidos de todos sus bares, o los de uno solo con `?bar=<id>`.
 * - Empleado: los pedidos de los bares en los que trabaja (hechos por él o por sus
 *   compañeros), o los de uno solo con `?bar=<id>`.
 * - Proveedor: los pedidos hechos a su empresa, de cualquier bar.
 *
 * Los pedidos se devuelven del más reciente al más antiguo, con el bar, el proveedor,
 * el usuario que lo hizo y los datos de cada producto.
 *
 * Ruta: `GET /api/pedidos/historial` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.query - Filtros opcionales.
 * @param {string} [req.query.bar] - ID de uno de los bares del encargado o del empleado
 *   (el proveedor lo ignora).
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con la lista de pedidos (puede estar vacía);
 *   `400` si el proveedor no está vinculado a ninguna empresa;
 *   `403` si el bar indicado no es del encargado o el empleado no trabaja en él.
 */
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
        } else if (req.user.role === 'empleado') {
            const {bar} = req.query;
            if (bar) {
                if (!mongoose.Types.ObjectId.isValid(bar) || !req.user.bares.some((id) => id.equals(bar))) {
                    return res.status(403).json({error: "No perteneces a ese bar"});
                }
                filtro = {bar};
            } else {
                filtro = {bar: {$in: req.user.bares}};
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
            .populate('proveedor', 'nombre_empresa')
            .sort({createdAt: -1});
        return res.status(200).json(pedidos);
    } catch (error) {
        return res.status(500).json({error: "error al obtener pedidos", details: error.message});
    }
};

/**
 * Estado al que puede pasar un pedido desde cada estado. Un pedido `entregado`
 * no tiene siguiente estado, así que ya no se puede modificar.
 * @type {Object<string, string>}
 */
const SIGUIENTE_ESTADO = {
    pendiente: 'enviado',
    enviado: 'entregado'
};

/**
 * Avanza el estado de un pedido: `pendiente` → `enviado` → `entregado`.
 * Solo se puede avanzar un paso cada vez, nunca retroceder ni saltar estados.
 * - Marcar como `enviado`: el proveedor del pedido o el encargado del bar.
 * - Marcar como `entregado`: el encargado del bar o un empleado de ese bar.
 *
 * Si el usuario no tiene relación con el pedido (no es de su bar ni de su empresa),
 * se responde `404`, como si el pedido no existiera.
 *
 * Ruta: `PATCH /api/pedidos/:id/estado` (empleados, encargados y proveedores).
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {Object} req.params - Parámetros de la ruta.
 * @param {string} req.params.id - ID del pedido.
 * @param {Object} req.body - Nuevo estado.
 * @param {string} req.body.estado - `enviado` o `entregado`.
 * @param {Object} req.user - Usuario autenticado (lo añade el middleware `isAuth`).
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} `200` con el pedido actualizado; `400` si el ID o el estado
 *   no son válidos o el cambio no es el siguiente paso; `403` si el usuario está
 *   relacionado con el pedido pero no puede hacer ese cambio; `404` si el pedido no
 *   existe o no tiene relación con él.
 */
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
            {path: 'usuario', select: 'nombre apellidos'},
            {path: 'proveedor', select: 'nombre_empresa'}
        ]);
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(400).json({error: "error al cambiar el estado del pedido", details: error.message});
    }
};

module.exports = {crearPedido, verPedidos, cambiarEstadoPedido};