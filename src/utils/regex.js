/**
 * Crea una expresión regular para buscar un texto tal cual, sin distinguir mayúsculas.
 * Escapa los caracteres especiales (como `(`, `.` o `*`) para que el texto del usuario
 * no se interprete como un patrón y no pueda romper la búsqueda.
 *
 * @example
 * regexBusqueda('mah');  // /mah/i -> encuentra "Mahou"
 * regexBusqueda('(');    // /\(/i -> busca el carácter "(" literalmente
 *
 * @param {string} texto - Texto que se quiere buscar.
 * @returns {RegExp} Expresión regular que no distingue mayúsculas.
 */
const regexBusqueda = (texto) => {
    const escapado = String(texto).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapado, 'i');
};

module.exports = {regexBusqueda};
