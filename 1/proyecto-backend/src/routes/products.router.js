import { Router } from 'express';
// Importamos nuestro modelo en lugar del viejo ProductManager
import { productModel } from '../models/product.model.js';

const router = Router();

// GET /api/products - AHORA CON PAGINACIÓN Y FILTROS DE MONGOOSE
router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    // 1. Armamos el filtro (query)
    const filter = {};
    if (query) {
      // Si el query es 'true' o 'false', filtramos por disponibilidad (status)
      if (query === 'true' || query === 'false') {
        filter.status = query === 'true';
      } else {
        // Sino, asumimos que estamos filtrando por categoría
        filter.category = query;
      }
    }

    // 2. Armamos las opciones de paginación y ordenamiento
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      lean: true // lean: true es vital para que Handlebars pueda leer los documentos después
    };

    // Si pasaron un sort ('asc' o 'desc'), lo agregamos a las opciones
    if (sort === 'asc') {
      options.sort = { price: 1 };
    } else if (sort === 'desc') {
      options.sort = { price: -1 };
    }

    // 3. Ejecutamos la consulta con mongoose-paginate-v2
    const result = await productModel.paginate(filter, options);

    // 4. Construimos los links previos y siguientes si existen
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    
    // Función auxiliar para mantener los queries en la URL
    const buildLink = (pageNumber) => {
      let link = `${baseUrl}?page=${pageNumber}&limit=${options.limit}`;
      if (sort) link += `&sort=${sort}`;
      if (query) link += `&query=${query}`;
      return link;
    };

    const prevLink = result.hasPrevPage ? buildLink(result.prevPage) : null;
    const nextLink = result.hasNextPage ? buildLink(result.nextPage) : null;

    // 5. Devolvemos el formato exacto que pide la entrega final
    res.json({
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink,
      nextLink
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error interno del servidor', details: error.message });
  }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    res.json({ status: 'success', payload: product });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al buscar el producto' });
  }
});

// POST /api/products - CON SOCKET.IO
router.post('/', async (req, res) => {
  try {
    // Validamos datos faltantes obligatorios (Criterios de evaluación)
    const { title, description, code, price, stock, category } = req.body;
    if (!title || !description || !code || !price || !stock || !category) {
      return res.status(400).json({ status: 'error', message: 'Faltan datos obligatorios para crear el producto' });
    }

    const newProduct = await productModel.create(req.body);
    
    // Emitir evento de socket (enviamos los últimos 50 productos para no saturar)
    const products = await productModel.find().limit(50).lean();
    req.io.emit('updateProducts', products);
    
    res.status(201).json({ status: 'success', payload: newProduct });
  } catch (error) {
    // Capturamos error si el código ya existe
    if(error.code === 11000) return res.status(400).json({ status: 'error', message: 'Ya existe un producto con ese código (code)' });
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  try {
    // { new: true } devuelve el documento actualizado en lugar del viejo
    const updatedProduct = await productModel.findByIdAndUpdate(req.params.pid, req.body, { new: true });
    
    if(!updatedProduct) return res.status(404).json({ status: 'error', message: 'Producto no encontrado para actualizar' });
    
    res.json({ status: 'success', payload: updatedProduct });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// DELETE /api/products/:pid - CON SOCKET.IO
router.delete('/:pid', async (req, res) => {
  try {
    const deletedProduct = await productModel.findByIdAndDelete(req.params.pid);
    
    if(!deletedProduct) return res.status(404).json({ status: 'error', message: 'Producto no encontrado para eliminar' });
    
    // Emitir evento de socket
    const products = await productModel.find().limit(50).lean();
    req.io.emit('updateProducts', products);
    
    res.json({ status: 'success', message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
