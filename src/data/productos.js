const IMAGEN = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const FOTOS = 'https://res.cloudinary.com/doasb61co/image/upload/productos';

const productos = [
    {proveedor: 'Cafés Tavira', nombre: 'Supremo Espresso 1KG', precio: 18.2, medida: 'unidad', stock_optimo_invierno: 8, stock_optimo_verano: 8, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-supremeespresso.jpg`},
    {proveedor: 'Cafés Tavira', nombre: 'Descafeinado Espresso (caja 80)', precio: 16.75, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-descafeinadoespresso.png`},
    {proveedor: 'Cafés Tavira', nombre: 'Azúcar en tubo (caja 1000 sobres)', precio: 16.9, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-azucarentubo.jpg`},
    {proveedor: 'Cafés Tavira', nombre: 'Azúcar moreno 5 g (100 unidades)', precio: 4.5, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-azucarmoreno.jpg`},
    {proveedor: 'Cafés Tavira', nombre: 'Edulcorante (caja 250 sobres de 1 g)', precio: 5.9, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-sacarina.jpg`},
    {proveedor: 'Cafés Tavira', nombre: 'Infusiones pirámide (caja 15)', precio: 3.5, medida: 'unidad', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-infusiones.jpg`},
    {proveedor: 'Cafés Tavira', nombre: 'Cola Cao (caja 50 sobres de 8 g)', precio: 17.33, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-colacao.webp`},
    {proveedor: 'Cafés Tavira', nombre: 'Leche condensada Prosalud 30 g (caja 40)', precio: 10, medida: 'unidad', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Cafetería', imagen: `${FOTOS}/cafes-tavira-lechecondensada.jpg`},

    {proveedor: 'Exclusivas Ramírez', nombre: 'Zumo Juver manzana 1L brik (caja 12)', precio: 11.19, medida: 'caja', stock_optimo_invierno: 3, stock_optimo_verano: 3, categoria: 'Refrescos', imagen: `${FOTOS}/exclusivas-ramirez-zumomanzana.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Zumo Granini piña 200ml (caja 24)', precio: 18.59, medida: 'caja', stock_optimo_invierno: 3, stock_optimo_verano: 3, categoria: 'Refrescos', imagen: `${FOTOS}/exclusivas-ramirez-zumopinagranini200ml.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Agua Perrier con gas 33cl (caja 24)', precio: 18.96, medida: 'caja', stock_optimo_invierno: 4, stock_optimo_verano: 4, categoria: 'Refrescos', imagen: `${FOTOS}/exclusivas-ramirez-aguaperrier.webp`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Sifón Geyser 1,5L (caja 6)', precio: 9.93, medida: 'caja', stock_optimo_invierno: 3, stock_optimo_verano: 3, categoria: 'Refrescos', imagen: `${FOTOS}/exclusivas-ramirez-sifongeyser.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Red Bull lata (caja 24)', precio: 23.6, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Refrescos', imagen: `${FOTOS}/exclusivas-ramirez-redbull.webp`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Alhambra Reserva 1925 tercio (caja 24)', precio: 20.96, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Cervezas', imagen: `${FOTOS}/exclusivas-ramirez-alhambra.webp`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Corona 330ml (caja 24)', precio: 20.66, medida: 'caja', stock_optimo_invierno: 4, stock_optimo_verano: 4, categoria: 'Cervezas', imagen: `${FOTOS}/exclusivas-ramirez-corona.webp`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Ondarre 7 Parcelas tinto crianza (caja 6)', precio: 30.59, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Vinos', imagen: `${FOTOS}/exclusivas-ramirez-ondarre.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Arcabucero tinto 1L (caja 12)', precio: 26.33, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Vinos', imagen: `${FOTOS}/exclusivas-ramirez-arcabucero.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Patatas Supreme 45g (caja 24)', precio: 10.43, medida: 'caja', stock_optimo_invierno: 3, stock_optimo_verano: 3, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-patatassupreme.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Cóctel frutos secos R55 1kg', precio: 4.55, medida: 'unidad', stock_optimo_invierno: 4, stock_optimo_verano: 4, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-frutossecos.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Atún en aceite Claramar bolsa 1kg', precio: 5.48, medida: 'unidad', stock_optimo_invierno: 4, stock_optimo_verano: 4, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-atun.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Mayonesa monodosis (caja 200 sobres)', precio: 11.92, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-mahonesamonodosis.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'Ketchup monodosis (caja 300 sobres)', precio: 13.89, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-ketchupmonodosis.jpg`},
    {proveedor: 'Exclusivas Ramírez', nombre: 'President La Crème (caja 6)', precio: 9.78, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Alimentación', imagen: `${FOTOS}/exclusivas-ramirez-presidentlacreme.png`},

    {proveedor: 'Comercial Tabarca', nombre: 'Agua Lanjarón 50cl PET (caja 24)', precio: 7.2, medida: 'caja', stock_optimo_invierno: 8, stock_optimo_verano: 8, categoria: 'Refrescos', imagen: `${FOTOS}/comercial-tabarca-lanjaron50.jpg`},
    {proveedor: 'Comercial Tabarca', nombre: 'Agua Lanjarón 1,25L PET (caja 15)', precio: 7.2, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Refrescos', imagen: `${FOTOS}/comercial-tabarca-lanjaron125.jpg`},
    {proveedor: 'Comercial Tabarca', nombre: 'Schweppes tónica Premium 200ml (caja 24)', precio: 45.14, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Refrescos', imagen: `${FOTOS}/comercial-tabarca-scheweppes.webp`},

    {proveedor: 'Distribuciones Guillén', nombre: 'Viña Real rosado 75cl (caja 6)', precio: 35.4, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Vinos', imagen: `${FOTOS}/distribuciones-guillen-vinarealrosado.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Castelo Rueda Verdejo 75cl (caja 6)', precio: 31.5, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Vinos', imagen: `${FOTOS}/distribuciones-guillen-castelo75.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Castelo Rueda Verdejo Magnum 1,5L (caja 6)', precio: 61.8, medida: 'caja', stock_optimo_invierno: 2, stock_optimo_verano: 2, categoria: 'Vinos', imagen: `${FOTOS}/distribuciones-guillen-castelogrande.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Cava Roger Goulart Brut Millésime 75cl (caja 6)', precio: 48, medida: 'caja', stock_optimo_invierno: 6, stock_optimo_verano: 6, categoria: 'Vinos', imagen: `${FOTOS}/distribuciones-guillen-rogergoulart.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Sangría Valdepablo 1,5L cristal (caja 6)', precio: 23.1, medida: 'caja', stock_optimo_invierno: 4, stock_optimo_verano: 4, categoria: 'Vinos', imagen: `${FOTOS}/distribuciones-guillen-sangria.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Tequila El Jimador blanco 70cl (caja 6)', precio: 114.9, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Licores', imagen: `${FOTOS}/distribuciones-guillen-tequila.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Vermut Yzaguirre Reserva blanco 1L (caja 6)', precio: 58.14, medida: 'caja', stock_optimo_invierno: 1, stock_optimo_verano: 1, categoria: 'Licores', imagen: `${FOTOS}/distribuciones-guillen-yzaguirre-blanco-reserva.jpg`},
    {proveedor: 'Distribuciones Guillén', nombre: 'Jamón ibérico cebo 50% Aljomar 100g', precio: 8.5, medida: 'unidad', stock_optimo_invierno: 7, stock_optimo_verano: 7, categoria: 'Alimentación', imagen: `${FOTOS}/distribuciones-guillen-jamon.jpg`}
].map((producto) => ({...producto, imagen: producto.imagen ?? IMAGEN}));

module.exports = productos;
