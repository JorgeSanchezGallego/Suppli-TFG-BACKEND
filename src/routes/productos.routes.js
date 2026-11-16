const express = require('express');
const {verProductos, crearProducto, actualizarProducto, eliminarProducto, buscarProductoPorNombre, buscarProductoPorCategoria, buscarProductoPorProveedor} = require('../controllers/productos.controllers');
const {isAuth, esEncargado, esProveedor, esEmpleado} = require('../middlewares/auth.middleware');
const {subidaProducto} = require('../middlewares/file');

const router = express.Router();

router.get('/', [isAuth, esEmpleado, esEncargado], verProductos);
router.get('/buscar/nombre/:nombre', [isAuth, esEmpleado, esEncargado], buscarProductoPorNombre);
router.get('/buscar/categoria/:categoria', [isAuth, esEmpleado, esEncargado], buscarProductoPorCategoria);
router.get('/buscar/proveedor/:proveedor', [isAuth, esEmpleado, esEncargado], buscarProductoPorProveedor);
router.post('/', [isAuth, esProveedor, esEncargado, subidaProducto.single('imagen')], crearProducto);
router.patch('/:id', [isAuth, esProveedor, esEncargado, subidaProducto.single('imagen')], actualizarProducto);
router.delete('/:id', [isAuth, esProveedor, esEncargado], eliminarProducto);

module.exports = router;
