const express = require('express');
const  {crearPedido, verPedidos} = require('../controllers/pedidos.controllers');
const {isAuth, permitirRoles} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', [isAuth, permitirRoles('empleado')], crearPedido);

router.get('/historial', [isAuth, permitirRoles('encargado', 'proveedor')], verPedidos);

module.exports = router;