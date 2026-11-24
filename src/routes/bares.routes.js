const express = require('express');
const {
    cargarBarPropio,
    añadirEncargado,
    quitarEncargado,
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
const {subidaBar} = require('../middlewares/file');
const router = express.Router();

router.use(isAuth, esEncargado);

router.post('/', subidaBar.single('imagen'), crearBar);
router.get('/', verMisBares);

router.patch('/:id', cargarBarPropio, subidaBar.single('imagen'), editarBar);
router.delete('/:id', cargarBarPropio, borrarBar);
router.get('/:id/pedidos', cargarBarPropio, verPedidosBar);
router.get('/:id/empleados', cargarBarPropio, verEmpleadosBar);
router.post('/:id/empleados', cargarBarPropio, añadirEmpleado);
router.delete('/:id/empleados/:usuarioId', cargarBarPropio, quitarEmpleado);
router.post('/:id/encargados', cargarBarPropio, añadirEncargado);
router.delete('/:id/encargados/:usuarioId', cargarBarPropio, quitarEncargado);

module.exports = router;
