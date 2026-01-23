import { Router } from 'express';
import CartManager from '../managers/CartManager.js';

const router = Router();
const cartManager = new CartManager('./src/data/carts.json');

// POST /api/carts
router.post('/', async (req, res) => {
  try {
    const newCart = await cartManager.createCart();
    res.status(201).json({ status: 'success', payload: newCart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/carts/:cid
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(parseInt(req.params.cid));
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }
    res.json({ status: 'success', payload: cart.products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/carts/:cid/product/:pid
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const updatedCart = await cartManager.addProductToCart(
      parseInt(req.params.cid),
      parseInt(req.params.pid)
    );
    res.json({ status: 'success', payload: updatedCart });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

export default router;
