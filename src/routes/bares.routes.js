const express = require('express');
const {
    cargarBarPropio,
    crearBar,
    verMisBares,
    editarBar,
    borrarBar,
    añadirEmpleado,
    quitarEmpleado,
    verPedidosBar,
    verEmpleadosBar
} = require('../controllers/bares.controllers');
const {isAuth, esEncargado} = require('../middlewares/auth.middleware');
const router = express.Router();

router.use(isAuth, esEncargado);

router.post('/', crearBar);
router.get('/', verMisBares);

router.patch('/:id', cargarBarPropio, editarBar);
router.delete('/:id', cargarBarPropio, borrarBar);
router.get('/:id/pedidos', cargarBarPropio, verPedidosBar);
router.get('/:id/empleados', cargarBarPropio, verEmpleadosBar);
router.post('/:id/empleados', cargarBarPropio, añadirEmpleado);
router.delete('/:id/empleados/:usuarioId', cargarBarPropio, quitarEmpleado);

module.exports = router;
