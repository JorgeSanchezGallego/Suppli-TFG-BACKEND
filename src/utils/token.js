const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para un usuario, firmado con `JWT_SECRET` y válido durante 1 día.
 *
 * @param {import('mongoose').Types.ObjectId|string} id - ID del usuario.
 * @param {string} email - Correo del usuario.
 * @returns {string} Token JWT con el `id` y el `email` del usuario.
 */
const generarToken = (id, email) => {
    return jwt.sign(
        {id, email},
        process.env.JWT_SECRET,
        {expiresIn: '1d'}
    )
}

/**
 * Verifica un token JWT con `JWT_SECRET` y devuelve su contenido.
 *
 * @param {string} token - Token JWT.
 * @returns {{id: string, email: string, iat: number, exp: number}} Datos guardados en el token.
 * @throws {Error} Si el token no es válido o ha caducado.
 */
const verificarToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {generarToken, verificarToken};