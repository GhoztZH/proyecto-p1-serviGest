require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
// Permite peticiones desde tu frontend (Vite)
app.use(cors({
    origin: 'process.env.FRONTEND_URL'
}));

app.use(express.json()); // Permite recibir datos en formato JSON


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// Ruta de prueba (GET)
app.get('/api/saludo', (req, res) => {
    res.json({
        ok: true,
        mensaje: '¡Conexión exitosa entre Express y React!'
    });
});

// Ruta de prueba para recibir datos (POST)
app.post('/api/datos', (req, res) => {
    const datosRecibidos = req.body;
    res.status(201).json({
        ok: true,
        recibido: datosRecibidos
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
