const regexBusqueda = (texto) => {
    const escapado = String(texto).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapado, 'i');
};

module.exports = {regexBusqueda};
