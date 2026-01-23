import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager('./src/data/products.json');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.json({ status: 'success', payload: products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(parseInt(req.params.pid));
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    res.json({ status: 'success', payload: product });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json({ status: 'success', payload: newProduct });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  try {
    const updatedProduct = await productManager.updateProduct(parseInt(req.params.pid), req.body);
    res.json({ status: 'success', payload: updatedProduct });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
  try {
    await productManager.deleteProduct(parseInt(req.params.pid));
    res.json({ status: 'success', message: 'Producto eliminado' });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
});

export default router;
