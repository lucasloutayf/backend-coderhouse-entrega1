import fs from 'fs/promises';
import path from 'path';

class ProductManager {
  constructor(filePath) {
    this.path = filePath;
    this.products = [];
    this.init();
  }

  async init() {
    try {
      await this.loadProducts();
    } catch (error) {
      await this.saveProducts();
    }
  }

  async loadProducts() {
    const data = await fs.readFile(this.path, 'utf-8');
    this.products = JSON.parse(data);
  }

  async saveProducts() {
    await fs.writeFile(this.path, JSON.stringify(this.products, null, 2));
  }

  async getProducts() {
    await this.loadProducts();
    return this.products;
  }

  async getProductById(id) {
    await this.loadProducts();
    return this.products.find(p => p.id === id);
  }

  async addProduct(productData) {
    await this.loadProducts();
    
    // Validar campos requeridos
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        throw new Error(`El campo ${field} es requerido`);
      }
    }

    // Verificar que el code no se repita
    if (this.products.some(p => p.code === productData.code)) {
      throw new Error('El código del producto ya existe');
    }

    // Generar ID autoincrementable
    const newId = this.products.length > 0 
      ? Math.max(...this.products.map(p => p.id)) + 1 
      : 1;

    const newProduct = {
      id: newId,
      title: productData.title,
      description: productData.description,
      code: productData.code,
      price: productData.price,
      status: productData.status !== undefined ? productData.status : true,
      stock: productData.stock,
      category: productData.category,
      thumbnails: productData.thumbnails || []
    };

    this.products.push(newProduct);
    await this.saveProducts();
    return newProduct;
  }

  async updateProduct(id, updates) {
    await this.loadProducts();
    const index = this.products.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Producto no encontrado');
    }

    // No permitir actualizar el ID
    delete updates.id;
    
    this.products[index] = { ...this.products[index], ...updates };
    await this.saveProducts();
    return this.products[index];
  }

  async deleteProduct(id) {
    await this.loadProducts();
    const index = this.products.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Producto no encontrado');
    }

    this.products.splice(index, 1);
    await this.saveProducts();
  }
}

export default ProductManager;
