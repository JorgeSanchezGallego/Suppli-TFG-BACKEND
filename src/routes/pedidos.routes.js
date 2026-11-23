const express = require('express');
const {crearPedido, verPedidos, cambiarEstadoPedido} = require('../controllers/pedidos.controllers');
const {isAuth, permitirRoles} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', [isAuth, permitirRoles('empleado')], crearPedido);

router.get('/historial', [isAuth, permitirRoles('empleado', 'encargado', 'proveedor')], verPedidos);

router.patch('/:id/estado', [isAuth, permitirRoles('empleado', 'encargado')], cambiarEstadoPedido);

module.exports = router;