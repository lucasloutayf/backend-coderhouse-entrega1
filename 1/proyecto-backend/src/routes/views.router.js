import { Router } from 'express';
// Importamos los modelos de Mongoose
import { productModel } from '../models/product.model.js';
import { cartModel } from '../models/cart.model.js';

const router = Router();

// FUNCIÓN AUXILIAR: Busca un carrito o crea uno nuevo si no existe
const getOrCreateCart = async () => {
  let cart = await cartModel.findOne(); // Busca el primer carrito que encuentre
  if (!cart) {
    cart = await cartModel.create({ products: [] }); // Si no hay ninguno, crea uno vacío
  }
  return cart._id.toString(); // Devuelve el ID como texto
};

// VIEJA RUTA HOME
router.get('/', async (req, res) => {
  try {
    const products = await productModel.find().lean();
    res.render('home', { products });
  } catch (error) {
    res.status(500).send('Error al cargar productos');
  }
});

// VIEJA RUTA REALTIMEPRODUCTS
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productModel.find().lean();
    res.render('realTimeProducts', { products });
  } catch (error) {
    res.status(500).send('Error al cargar productos');
  }
});

// NUEVO: Ruta /products - Con Paginación como pide la entrega
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = { page: parseInt(page), limit: parseInt(limit), lean: true };
    const result = await productModel.paginate({}, options);

    // Conseguimos el ID del carrito automáticamente
    const activeCartId = await getOrCreateCart();

    res.render('products', {
      products: result.docs,
      totalPages: result.totalPages,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? `/products?page=${result.prevPage}&limit=${limit}` : null,
      nextLink: result.hasNextPage ? `/products?page=${result.nextPage}&limit=${limit}` : null,
      cartId: activeCartId // Usamos el ID automático
    });
  } catch (error) {
    res.status(500).send('Error al cargar la vista de productos');
  }
});

// NUEVO: Ruta /products/:pid - Vista de detalle de un producto
router.get('/products/:pid', async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).lean();
    if (!product) return res.status(404).send('Producto no encontrado');
    
    // Conseguimos el ID del carrito automáticamente
    const activeCartId = await getOrCreateCart();

    res.render('productDetail', { 
        product,
        cartId: activeCartId // Usamos el ID automático
    });
  } catch (error) {
    res.status(500).send('Error al cargar el detalle del producto');
  }
});

// NUEVO: Ruta /carts/:cid - Vista de un carrito específico
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await cartModel.findById(req.params.cid).populate('products.product').lean();
    if (!cart) return res.status(404).send('Carrito no encontrado');

    res.render('cart', { cart });
  } catch (error) {
    res.status(500).send('Error al cargar el carrito');
  }
});

export default router;
