const express = require('express');
const {verPedidosBar, verEmpleadosBar} = require('../controllers/bares.controllers');
const {isAuth, esEncargado} = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/:id/pedidos', [isAuth, esEncargado], verPedidosBar);
router.get('/:id/empleados', [isAuth, esEncargado], verEmpleadosBar);

module.exports = router;

