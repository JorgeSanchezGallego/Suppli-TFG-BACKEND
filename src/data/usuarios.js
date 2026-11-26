const CONTRASEÑA = 'Prueba1234';

const base = {
    fechaNacimiento: '1990-05-15',
    residencia: 'Alicante',
    contraseña: CONTRASEÑA
};

const usuarios = [
    {...base, nombre: 'Carlos', apellidos: 'Martín López', correo: 'encargado1@suppli.test', telefono: '600000001', role: 'encargado', bares: ['Kiosko Gómiz', 'Noray', 'Soho Parc']},
    {...base, nombre: 'Lucía', apellidos: 'Fernández Díaz', correo: 'encargado2@suppli.test', telefono: '600000002', role: 'encargado'},

    {...base, nombre: 'Ana', apellidos: 'García Pérez', correo: 'empleado1@suppli.test', telefono: '600000003', role: 'empleado', bares: ['Kiosko Gómiz', 'Noray']},
    {...base, nombre: 'David', apellidos: 'Sánchez Romero', correo: 'empleado2@suppli.test', telefono: '600000004', role: 'empleado', bares: ['Kiosko Gómiz']},
    {...base, nombre: 'Elena', apellidos: 'Navarro Torres', correo: 'empleado3@suppli.test', telefono: '600000005', role: 'empleado', bares: ['Soho Parc']},
    {...base, nombre: 'Pablo', apellidos: 'Jiménez Ortega', correo: 'empleado4@suppli.test', telefono: '600000006', role: 'empleado', bares: []},

    {...base, nombre: 'Alex', apellidos: 'Cafés Tavira', correo: 'proveedor1@suppli.test', telefono: '611000001', role: 'proveedor', proveedor: 'Cafés Tavira'},
    {...base, nombre: 'Manolo', apellidos: 'Tajuelo', correo: 'proveedor2@suppli.test', telefono: '611000002', role: 'proveedor', proveedor: 'Exclusivas Ramírez'},
    {...base, nombre: 'Esther', apellidos: 'Comercial Tabarca', correo: 'proveedor3@suppli.test', telefono: '611000003', role: 'proveedor', proveedor: 'Comercial Tabarca'},
    {...base, nombre: 'Jony', apellidos: 'Distribuciones Guillén', correo: 'proveedor4@suppli.test', telefono: '611000004', role: 'proveedor', proveedor: 'Distribuciones Guillén'}
];

module.exports = {usuarios, CONTRASEÑA};
