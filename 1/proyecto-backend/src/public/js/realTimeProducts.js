const socket = io();

// Formulario para agregar productos
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const product = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    code: document.getElementById('code').value,
    price: parseFloat(document.getElementById('price').value),
    stock: parseInt(document.getElementById('stock').value),
    category: document.getElementById('category').value
  };

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });

    if (response.ok) {
      document.getElementById('addProductForm').reset();
    } else {
      alert('Error al agregar producto');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

// Función para eliminar productos
async function deleteProduct(id) {
  if (confirm('¿Estás seguro de eliminar este producto?')) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        alert('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Escuchar actualizaciones de productos
socket.on('updateProducts', (products) => {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  if (products.length === 0) {
    productList.innerHTML = '<p>No hay productos disponibles</p>';
    return;
  }

  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-id', product.id);
    productCard.innerHTML = `
      <h3>${product.title}</h3>
      <p><strong>ID:</strong> ${product.id}</p>
      <p><strong>Descripción:</strong> ${product.description}</p>
      <p><strong>Código:</strong> ${product.code}</p>
      <p><strong>Precio:</strong> $${product.price}</p>
      <p><strong>Stock:</strong> ${product.stock}</p>
      <p><strong>Categoría:</strong> ${product.category}</p>
      <button class="delete-btn" onclick="deleteProduct(${product.id})">Eliminar</button>
    `;
    productList.appendChild(productCard);
  });
});
