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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (response.ok) {
            document.getElementById('addProductForm').reset();
            Toastify({
                text: "Producto agregado con éxito ✨",
                duration: 3000,
                gravity: "bottom", position: "right",
                style: { background: "#0b5f1e", borderRadius: "8px", fontFamily: "Poppins, sans-serif" }
            }).showToast();
        } else {
            const errorData = await response.json();
            Swal.fire('Error', errorData.message || 'No se pudo agregar el producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Función para eliminar productos con SweetAlert2
async function deleteProduct(id) {
    const result = await Swal.fire({
        title: '¿Borrar producto definitivo?',
        text: "Esto lo eliminará del catálogo y no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, borrarlo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                Toastify({
                    text: "Producto eliminado del sistema 🗑️",
                    duration: 3000,
                    gravity: "bottom", position: "right",
                    style: { background: "#f59e0b", borderRadius: "8px", fontFamily: "Poppins, sans-serif" }
                }).showToast();
            } else {
                Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Escuchar actualizaciones de productos (WebSockets)
socket.on('updateProducts', (products) => {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 3rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0; font-size: 1.1rem;">No hay productos disponibles actualmente.</p>
        </div>`;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        // USAMOS _id DE MONGODB
        productCard.setAttribute('data-id', product._id); 
        
        // Mantenemos el mismo diseño HTML que tenés en realTimeProducts.handlebars
        productCard.innerHTML = `
            <div>
                <h3>${product.title}</h3>
                <p class="product-info">${product.description}</p>
                <p class="product-info">Categoría: <strong>${product.category}</strong></p>
                <p class="product-info">Stock: ${product.stock} | Código: ${product.code}</p>
            </div>
            <div>
                <div class="price-tag">$${product.price}</div>
                <!-- PASAMOS EL _id ENTRE COMILLAS SIMPLES PORQUE ES UN STRING -->
                <button class="delete-btn" onclick="deleteProduct('${product._id}')">Eliminar</button>
            </div>
        `;
        productList.appendChild(productCard);
    });
});
