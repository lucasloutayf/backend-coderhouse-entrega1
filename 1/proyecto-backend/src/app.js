import express from 'express';
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import { createServer } from 'http';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 8080;

// Configurar Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./src/public'));

// Hacer io accesible en todas las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

export { io };
