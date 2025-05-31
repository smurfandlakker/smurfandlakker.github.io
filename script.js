// script.js
import { loadProducts, addToCart, getCartItems } from './db.js';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  initializeProductCards();
});

// Функция для обновления счетчика корзины
function updateCartCount() {
  getCartItems().then(items => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => {
      el.textContent = count;
    });
  }).catch(console.error);
}

// Инициализация карточек товаров
function initializeProductCards() {
  document.addEventListener('click', function(e) {
    // Обработка клика по карточке товара
    const productCard = e.target.closest('.product-card');
    if (productCard && !e.target.classList.contains('add-to-cart')) {
      const productId = productCard.dataset.id;
      if (productId) {
        window.location.href = `product.html?id=${productId}`;
      }
    }

    // Обработка кнопки "В корзину"
    if (e.target.classList.contains('add-to-cart')) {
      e.stopPropagation();
      const productId = parseInt(e.target.getAttribute('data-id'));
      addToCart(productId).then(() => {
        updateCartCount();
        showNotification('Товар добавлен в корзину');
      }).catch(console.error);
    }
  });
}

// Функция для отображения уведомлений
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }, 10);
}

// Функция для отображения товаров
export function renderProducts(products, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = products.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}">
          ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        </div>
        <div class="product-info">
          <h3>${product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}</h3>
          <p>${product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}</p>
          <div class="product-price">${product.price} ₽</div>
          <button class="add-to-cart" data-id="${product.id}">В корзину</button>
        </div>
      </div>
    `).join('');
  }
}

// Стили для уведомлений
const style = document.createElement('style');
style.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1000;
  }
  .notification.show {
    opacity: 1;
  }
`;
document.head.appendChild(style);
