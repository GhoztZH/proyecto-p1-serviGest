import { createServer } from './server.js';

const PORT = Number(process.env.PORT) || 3000;
const app = createServer();

app.listen(PORT, () => {
  console.log(`Servidor ServiGest API corriendo en http://localhost:${PORT}`);
});
