const express = require('express');
const {verProductos, crearProducto, actualizarProducto, eliminarProducto, buscarProductoPorNombre, buscarProductoPorCategoria, buscarProductoPorProveedor} = require('../controllers/productos.controllers');
const {isAuth, permitirRoles} = require('../middlewares/auth.middleware');
const {subidaProducto} = require('../middlewares/file');

const router = express.Router();

router.get('/', [isAuth, permitirRoles('empleado', 'encargado')], verProductos);
router.get('/buscar/nombre/:nombre', [isAuth, permitirRoles('empleado', 'encargado')], buscarProductoPorNombre);
router.get('/buscar/categoria/:categoria', [isAuth, permitirRoles('empleado', 'encargado')], buscarProductoPorCategoria);
router.get('/buscar/proveedor/:proveedor', [isAuth, permitirRoles('empleado', 'encargado')], buscarProductoPorProveedor);
router.post('/', [isAuth, permitirRoles('proveedor', 'encargado'), subidaProducto.single('imagen')], crearProducto);
router.patch('/:id', [isAuth, permitirRoles('proveedor', 'encargado'), subidaProducto.single('imagen')], actualizarProducto);
router.delete('/:id', [isAuth, permitirRoles('proveedor', 'encargado')], eliminarProducto);

module.exports = router;
