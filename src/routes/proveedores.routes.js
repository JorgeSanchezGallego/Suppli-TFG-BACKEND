const express = require('express');
const {
    cargarProveedor,
    puedeVerProveedor,
    puedeEditarProveedor,
    crearProveedor,
    verProveedores,
    verProveedor,
    editarProveedor,
    borrarProveedor
} = require('../controllers/proveedores.controllers');
const {isAuth, esEncargado, permitirRoles} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(isAuth);

router.get('/', verProveedores);
router.get('/:id', cargarProveedor, puedeVerProveedor, verProveedor);
router.post('/', esEncargado, crearProveedor);
router.patch('/:id', permitirRoles('encargado', 'proveedor'), cargarProveedor, puedeEditarProveedor, editarProveedor);
router.delete('/:id', esEncargado, cargarProveedor, borrarProveedor);

module.exports = router;
