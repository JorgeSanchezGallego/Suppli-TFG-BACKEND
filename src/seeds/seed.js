const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const Proveedor = require('../models/proveedor.model');
const Usuario = require('../models/usuario.model');
const Bar = require('../models/bar.model');
const Producto = require('../models/producto.model');
const Pedido = require('../models/pedido.model');

const proveedoresData = require('../data/proveedores');
const {usuarios: usuariosData} = require('../data/usuarios');
const baresData = require('../data/bares');
const productosData = require('../data/productos');
const pedidosData = require('../data/pedidos');

const buscar = (mapa, clave, tipo) => {
    const valor = mapa.get(clave);
    if (!valor) {
        throw new Error(`${tipo} "${clave}" no existe en los datos de prueba`);
    }
    return valor;
};

const sembrar = async () => {
    await Promise.all([
        Pedido.deleteMany({}),
        Producto.deleteMany({}),
        Bar.deleteMany({}),
        Usuario.deleteMany({}),
        Proveedor.deleteMany({})
    ]);
    console.log('Colecciones vaciadas');

    const proveedores = await Proveedor.insertMany(proveedoresData);
    const proveedorPorNombre = new Map(proveedores.map((p) => [p.nombre_empresa, p]));
    console.log(`${proveedores.length} proveedores creados`);

    const usuarioPorCorreo = new Map();
    for (const {bares, proveedor, ...datos} of usuariosData) {
        const usuario = await Usuario.create({
            ...datos,
            proveedor: proveedor ? buscar(proveedorPorNombre, proveedor, 'Proveedor')._id : undefined
        });
        usuarioPorCorreo.set(usuario.correo, usuario);
    }
    console.log(`${usuarioPorCorreo.size} usuarios creados`);

    const bares = await Bar.insertMany(baresData.map((bar) => ({
        ...bar,
        encargados: bar.encargados.map((correo) => buscar(usuarioPorCorreo, correo, 'Usuario')._id)
    })));
    const barPorNombre = new Map(bares.map((b) => [b.nombre, b]));
    console.log(`${bares.length} bares creados`);

    for (const {correo, bares: nombresBares = []} of usuariosData) {
        if (nombresBares.length > 0) {
            await Usuario.updateOne(
                {correo},
                {$set: {bares: nombresBares.map((nombre) => buscar(barPorNombre, nombre, 'Bar')._id)}}
            );
        }
    }
    console.log('Empleados asignados a sus bares');

    const productos = await Producto.insertMany(productosData.map((producto) => ({
        ...producto,
        proveedor: buscar(proveedorPorNombre, producto.proveedor, 'Proveedor')._id
    })));
    const productoPorNombre = new Map(productos.map((p) => [p.nombre, p]));
    console.log(`${productos.length} productos creados`);

    for (const pedido of pedidosData) {
        await Pedido.create({
            bar: buscar(barPorNombre, pedido.bar, 'Bar')._id,
            usuario: buscar(usuarioPorCorreo, pedido.usuario, 'Usuario')._id,
            proveedor: buscar(proveedorPorNombre, pedido.proveedor, 'Proveedor')._id,
            estado: pedido.estado,
            productos: pedido.productos.map(({producto, cantidad}) => {
                const productoDB = buscar(productoPorNombre, producto, 'Producto');
                return {
                    producto: productoDB._id,
                    nombre: productoDB.nombre,
                    precioUnitario: productoDB.precio,
                    cantidad
                };
            }),
            total: 0
        });
    }
    console.log(`${pedidosData.length} pedidos creados`);
};

const main = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {family: 4});
        console.log('Conectado a la BBDD');
        await sembrar();
        console.log('Seed completado 🌱');
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

main();
