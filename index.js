const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const { connectDB } = require('./src/config/db');
const { conectarCloudinary } = require('./src/config/cloudinary');
const pedidosRoutes = require('./src/routes/pedidos.routes');
const baresRoutes = require('./src/routes/bares.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const productosRoutes = require('./src/routes/productos.routes');




app.use(express.json());
app.use(cors());

connectDB();
conectarCloudinary();

app.use('/api/pedidos', pedidosRoutes);
app.use('/api/bares', baresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);

app.use((req, res, next) => {
    return res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});