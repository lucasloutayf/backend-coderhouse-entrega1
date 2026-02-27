import { Router } from 'express';
// Importamos nuestro modelo de mongoose
import { cartModel } from '../models/cart.model.js';

const router = Router();

// POST /api/carts - Crear un nuevo carrito vacío
router.post('/', async (req, res) => {
  try {
    const newCart = await cartModel.create({ products: [] });
    res.status(201).json({ status: 'success', payload: newCart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/carts/:cid - Traer carrito (CON POPULATE)
router.get('/:cid', async (req, res) => {
  try {
    // El .populate() ya lo tenemos configurado en el cart.model.js (pre 'findOne'),
    // pero lo ponemos acá también por las dudas o si querés forzarlo.
    const cart = await cartModel.findById(req.params.cid).populate('products.product');
    
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }
    
    // Devolvemos la estructura completa del carrito con los productos "desglosados"
    res.json({ status: 'success', payload: cart.products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/carts/:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;

        const cart = await cartModel.findById(cartId);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

        // Buscamos si el producto existe comparando el ID del ObjectId de Mongoose
        // Usamos .equals() que es la forma nativa y segura de Mongoose de comparar IDs
        const productInCart = cart.products.find(p => p.product._id.equals(productId));

        if (productInCart) {
            // Si existe, le sumamos 1
            productInCart.quantity += 1;
        } else {
            // Si no existe, lo pusheamos
            cart.products.push({ product: productId, quantity: 1 });
        }

        // IMPORTANTE: Le avisamos a Mongoose que modificamos el array para que lo guarde bien
        cart.markModified('products');
        
        const updatedCart = await cart.save();
        res.json({ status: 'success', payload: updatedCart });
        
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});




// DELETE api/carts/:cid/products/:pid - Eliminar producto seleccionado usando $pull
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    
    // Mongoose tiene un comando directo ($pull) para arrancar elementos de un array
    // Le decimos: "Buscá el carrito 'cid' y sacá de su array 'products' el objeto que tenga 'product: pid'"
    const updatedCart = await cartModel.findByIdAndUpdate(
      cid,
      { $pull: { products: { product: pid } } },
      { new: true } // Para que nos devuelva el carrito ya actualizado
    );

    if (!updatedCart) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }
    
    res.json({ status: 'success', message: 'Producto eliminado', payload: updatedCart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// NUEVO: PUT api/carts/:cid - Actualizar todos los productos con un arreglo nuevo
router.put('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body; // Espera un { "products": [ { "product": "ID", "quantity": 2 } ] }

    if (!Array.isArray(products)) {
      return res.status(400).json({ status: 'error', message: 'El body debe contener un arreglo de productos' });
    }

    const cart = await cartModel.findByIdAndUpdate(
      cid, 
      { products: products }, 
      { new: true } // Para que devuelva el documento actualizado
    );

    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

    res.json({ status: 'success', payload: cart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT api/carts/:cid/products/:pid - Actualizar SOLO la cantidad
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const cart = await cartModel.findById(cid);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

    // BUSCAMOS CON .equals() DE MONGOOSE, ESTO EVITA EL 404
    const productInCart = cart.products.find(p => p.product._id.equals(pid));
    
    if (productInCart) {
      productInCart.quantity = Number(quantity);
      cart.markModified('products'); // Obligatorio para guardar cambios en arrays
      await cart.save();
      res.json({ status: 'success', payload: cart });
    } else {
      res.status(404).json({ status: 'error', message: 'Ese producto no está en el carrito' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// DELETE api/carts/:cid/products/:pid - Eliminar producto seleccionado
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    
    const cart = await cartModel.findById(cid);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

    // FILTRAMOS COMPARANDO COMO STRING PARA NO ERRARLE
    cart.products = cart.products.filter(p => p.product._id.toString() !== pid);
    
    cart.markModified('products');
    await cart.save();
    
    res.json({ status: 'success', message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// NUEVO: DELETE api/carts/:cid - Vaciar TODO el carrito
router.delete('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    // Le asignamos un array vacío a los productos
    const cart = await cartModel.findByIdAndUpdate(
      cid, 
      { products: [] }, 
      { new: true }
    );

    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

    res.json({ status: 'success', message: 'Carrito vaciado exitosamente', payload: cart });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
