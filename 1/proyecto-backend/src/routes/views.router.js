import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager('./src/data/products.json');

// Ruta home
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('home', { products });
  } catch (error) {
    res.status(500).send('Error al cargar productos');
  }
});

// Ruta realTimeProducts
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('realTimeProducts', { products });
  } catch (error) {
    res.status(500).send('Error al cargar productos');
  }
});

export default router;
