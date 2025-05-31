// script.js
export function renderProducts(products, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-price">${product.price} ₽</div>
        <button class="btn add-to-cart" data-id="${product.id}">
          В корзину
        </button>
      </div>
    </div>
  `).join('');
}

// Инициализация на странице товаров
if (document.getElementById('products-container')) {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get('category');
      
      const products = await loadProducts(category);
      renderProducts(products, '#products-container');
      
      console.log('Products loaded:', products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  });
}
