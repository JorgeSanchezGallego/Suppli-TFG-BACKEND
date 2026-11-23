const pedidos = [
    {
        bar: 'Kiosko Gómiz',
        usuario: 'empleado1@suppli.test',
        proveedor: 'Bebidas del Sur',
        estado: 'entregado',
        productos: [
            {producto: 'Refresco de cola 33cl', cantidad: 48},
            {producto: 'Agua mineral 50cl', cantidad: 24}
        ]
    },
    {
        bar: 'Kiosko Gómiz',
        usuario: 'empleado2@suppli.test',
        proveedor: 'Cervezas La Cañada',
        estado: 'pendiente',
        productos: [
            {producto: 'Barril de cerveza 30L', cantidad: 2},
            {producto: 'Cerveza sin alcohol 33cl', cantidad: 12}
        ]
    },
    {
        bar: 'Noray',
        usuario: 'empleado1@suppli.test',
        proveedor: 'Distribuciones Frescas',
        estado: 'pendiente',
        productos: [
            {producto: 'Limones', cantidad: 3},
            {producto: 'Aceitunas aliñadas', cantidad: 2}
        ]
    },
    {
        bar: 'Soho Parc',
        usuario: 'empleado3@suppli.test',
        proveedor: 'Bebidas del Sur',
        estado: 'pendiente',
        productos: [
            {producto: 'Tónica 20cl', cantidad: 24},
            {producto: 'Refresco de naranja 33cl', cantidad: 24}
        ]
    }
];

module.exports = pedidos;
