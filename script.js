// script.js
function updateCartCount() {
    getCartItems().then(items => {
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('#cart-count').forEach(el => {
            el.textContent = count;
        });
    }).catch(console.error);
}

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

// Добавляем стили для уведомлений
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Обработка кликов по карточкам товаров
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard && !e.target.classList.contains('add-to-cart')) {
            const productId = productCard.dataset.id;
            window.location.href = `products/product.html?id=${productId}`;
        }
    });
    
    updateCartCount();
});
