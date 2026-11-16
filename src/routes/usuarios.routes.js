const express = require('express');
const {registrarUsuario, loginUsuario} = require('../controllers/usuarios.controllers');

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;