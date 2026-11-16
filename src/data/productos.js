const IMAGEN = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

const productos = [
    {proveedor: 'Bebidas del Sur', nombre: 'Refresco de cola 33cl', precio: 0.65, medida: 'lata', stock_optimo_invierno: 48, stock_optimo_verano: 96, categoria: 'refrescos'},
    {proveedor: 'Bebidas del Sur', nombre: 'Refresco de naranja 33cl', precio: 0.6, medida: 'lata', stock_optimo_invierno: 24, stock_optimo_verano: 72, categoria: 'refrescos'},
    {proveedor: 'Bebidas del Sur', nombre: 'Agua mineral 50cl', precio: 0.3, medida: 'botella', stock_optimo_invierno: 48, stock_optimo_verano: 120, categoria: 'agua'},
    {proveedor: 'Bebidas del Sur', nombre: 'Tónica 20cl', precio: 0.55, medida: 'botella', stock_optimo_invierno: 24, stock_optimo_verano: 48, categoria: 'refrescos'},

    {proveedor: 'Cervezas La Cañada', nombre: 'Barril de cerveza 30L', precio: 85, medida: 'barril', stock_optimo_invierno: 2, stock_optimo_verano: 5, categoria: 'cerveza'},
    {proveedor: 'Cervezas La Cañada', nombre: 'Cerveza tostada 33cl', precio: 0.8, medida: 'botella', stock_optimo_invierno: 48, stock_optimo_verano: 96, categoria: 'cerveza'},
    {proveedor: 'Cervezas La Cañada', nombre: 'Cerveza sin alcohol 33cl', precio: 0.7, medida: 'botella', stock_optimo_invierno: 24, stock_optimo_verano: 48, categoria: 'cerveza'},

    {proveedor: 'Distribuciones Frescas', nombre: 'Limones', precio: 1.9, medida: 'kg', stock_optimo_invierno: 3, stock_optimo_verano: 6, categoria: 'fruta'},
    {proveedor: 'Distribuciones Frescas', nombre: 'Aceitunas aliñadas', precio: 4.5, medida: 'kg', stock_optimo_invierno: 2, stock_optimo_verano: 4, categoria: 'aperitivos'},
    {proveedor: 'Distribuciones Frescas', nombre: 'Patatas fritas', precio: 3.2, medida: 'bolsa 1kg', stock_optimo_invierno: 5, stock_optimo_verano: 10, categoria: 'aperitivos'}
].map((producto) => ({...producto, imagen: IMAGEN}));

module.exports = productos;
