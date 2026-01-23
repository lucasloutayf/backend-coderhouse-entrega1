import fs from 'fs/promises';

class CartManager {
  constructor(filePath) {
    this.path = filePath;
    this.carts = [];
    this.init();
  }

  async init() {
    try {
      await this.loadCarts();
    } catch (error) {
      await this.saveCarts();
    }
  }

  async loadCarts() {
    const data = await fs.readFile(this.path, 'utf-8');
    this.carts = JSON.parse(data);
  }

  async saveCarts() {
    await fs.writeFile(this.path, JSON.stringify(this.carts, null, 2));
  }

  async createCart() {
    await this.loadCarts();
    
    const newId = this.carts.length > 0 
      ? Math.max(...this.carts.map(c => c.id)) + 1 
      : 1;

    const newCart = {
      id: newId,
      products: []
    };

    this.carts.push(newCart);
    await this.saveCarts();
    return newCart;
  }

  async getCartById(id) {
    await this.loadCarts();
    return this.carts.find(c => c.id === id);
  }

  async addProductToCart(cartId, productId) {
    await this.loadCarts();
    const cart = this.carts.find(c => c.id === cartId);
    
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    const productIndex = cart.products.findIndex(p => p.product === productId);
    
    if (productIndex !== -1) {
      // Si el producto ya existe, incrementar cantidad
      cart.products[productIndex].quantity += 1;
    } else {
      // Si no existe, agregarlo con cantidad 1
      cart.products.push({
        product: productId,
        quantity: 1
      });
    }

    await this.saveCarts();
    return cart;
  }
}

export default CartManager;
