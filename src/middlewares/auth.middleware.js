const Usuario = require('../models/usuario.model');
const {verificarToken} = require('../utils/token');

/**
 * Middleware de autenticación. Lee el token JWT de la cabecera
 * `Authorization: Bearer <token>`, lo verifica y busca el usuario en la base de datos.
 * Si todo es correcto, deja el usuario en `req.user` para los siguientes middlewares
 * y controladores.
 *
 * @async
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
 * @returns {Promise<void>} Llama a `next()` si el token es válido; si no, responde `401`
 *   cuando falta la cabecera, el token no es válido o ha caducado, o el usuario ya no existe.
 */
const isAuth = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return res.status(401).json("No autorizado");
        }
        const token = authorization.split(' ')[1];
        const {id } = verificarToken(token);
        const user = await Usuario.findById(id);
        if (!user){
            return res.status(401).json("Token o usuario no válido");
        }
        req.user = user;
        next();    
    } catch (error) {
        return res.status(401).json("Token no válido o sesión expirada");
    }}

    /**
     * Middleware que solo deja pasar a los usuarios con rol `encargado`.
     * Debe ir después de `isAuth`, que es quien rellena `req.user`.
     *
     * @param {import('express').Request} req - Petición de Express.
     * @param {import('express').Response} res - Respuesta de Express.
     * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
     * @returns {void} Llama a `next()` si el usuario es encargado; si no, responde `403`.
     */
    const esEncargado = (req, res, next) => {
        try {
            if (req.user &&req.user.role === 'encargado') {
                return next();
            } else {
                return res.status(403).json("Acceso denegado. Solo los encargados pueden acceder a esta ruta.");
            }
        } catch (error) {
            return res.status(403).json("Error de permisos. Acceso denegado.");
        }}

    /**
     * Middleware que solo deja pasar a los usuarios con rol `proveedor`.
     * Debe ir después de `isAuth`, que es quien rellena `req.user`.
     *
     * @param {import('express').Request} req - Petición de Express.
     * @param {import('express').Response} res - Respuesta de Express.
     * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
     * @returns {void} Llama a `next()` si el usuario es proveedor; si no, responde `403`.
     */
    const esProveedor = (req, res, next) => {
        try {
            if (req.user && req.user.role === 'proveedor') {
                return next();
            } else {
                return res.status(403).json("Acceso denegado. Solo los proveedores pueden acceder a esta ruta.");
            }
        } catch (error) {
            return res.status(403).json("Error de permisos. Acceso denegado.");
        }}

    /**
     * Middleware que solo deja pasar a los usuarios con rol `empleado`.
     * Debe ir después de `isAuth`, que es quien rellena `req.user`.
     *
     * @param {import('express').Request} req - Petición de Express.
     * @param {import('express').Response} res - Respuesta de Express.
     * @param {import('express').NextFunction} next - Pasa al siguiente middleware o controlador.
     * @returns {void} Llama a `next()` si el usuario es empleado; si no, responde `403`.
     */
    const esEmpleado = (req, res, next) => {
        try {
            if (req.user && req.user.role === 'empleado') {
                return next();
            } else {
                return res.status(403).json("Acceso denegado. Solo los empleados pueden acceder a esta ruta.");
            }
        } catch (error) {
            return res.status(403).json("Error de permisos. Acceso denegado.");
        }}

    
    /**
     * Crea un middleware que solo deja pasar a los usuarios con alguno de los roles indicados.
     * Debe ir después de `isAuth`, que es quien rellena `req.user`.
     *
     * @example
     * router.get('/historial', [isAuth, permitirRoles('encargado', 'proveedor')], verPedidos);
     *
     * @param {...string} roles - Roles permitidos (`empleado`, `encargado` y/o `proveedor`).
     * @returns {import('express').RequestHandler} Middleware que llama a `next()` si el rol
     *   del usuario está permitido o responde `403` indicando los roles permitidos.
     */
    const permitirRoles = (...roles) => (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json(`Acceso denegado. Roles permitidos: ${roles.join(', ')}.`);
    };

    module.exports = {isAuth, esEncargado, esProveedor, esEmpleado, permitirRoles};