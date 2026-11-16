const express = require('express');
const {registrarUsuario, loginUsuario, buscarUsuarios, cambiarRol} = require('../controllers/usuarios.controllers');
const {isAuth, esEncargado} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/', [isAuth, esEncargado], buscarUsuarios);
router.patch('/:id/rol', [isAuth, esEncargado], cambiarRol);

module.exports = router;
