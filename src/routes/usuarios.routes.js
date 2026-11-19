const express = require('express');
const {registrarUsuario, loginUsuario, verUsuarioActual, buscarUsuarios, cambiarRol} = require('../controllers/usuarios.controllers');
const {isAuth, esEncargado} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/yo', isAuth, verUsuarioActual);
router.get('/', [isAuth, esEncargado], buscarUsuarios);
router.patch('/:id/rol', [isAuth, esEncargado], cambiarRol);

module.exports = router;
