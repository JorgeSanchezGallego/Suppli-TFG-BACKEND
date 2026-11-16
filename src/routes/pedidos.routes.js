const express = require('express');
const  {crearPedido, verPedidos} = require('../controllers/pedidos.controllers');
const {isAuth, esEncargado, esProveedor, esEmpleado} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', [isAuth, esEmpleado], crearPedido);

router.get('/historial', [isAuth, esEncargado, esProveedor], verPedidos);

module.exports = router;