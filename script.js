// Инициализация базы данных
function initDB() {
    return new Promise((resolve, reject) {
        const request = window.indexedDB.open('SoapFantasyDB', 1);

        request.onerror = function(event) {
            console.error("Ошибка при открытии базы данных:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            const productsStore = db.createObjectStore('products', { keyPath: 'id' });
            productsStore.createIndex('category', 'category', { unique: false });

            const cartStore = db.createObjectStore('cart', { keyPath: 'id' });

            const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
            reviewsStore.createIndex('productId', 'productId', { unique: false });

            const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
        };
    });
}

// Загрузка продуктов
function loadProducts(category = null) {
    return new Promise((resolve, reject) {
        initDB().then(db => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            let request;

            if (category) {
                const index = store.index('category');
                request = index.getAll(category);
            } else {
                request = store.getAll();
            }

            request.onsuccess = function() {
                resolve(request.result || []);
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Добавление в корзину
function addToCart(productId) {
    return new Promise((resolve, reject) {
        initDB().then(db => {
            const transaction = db.transaction(['products'], 'readonly');
            const productsStore = transaction.objectStore('products');
            const request = productsStore.get(productId);

            request.onsuccess = function() {
                const product = request.result;
                if (product) {
                    const cartTransaction = db.transaction(['cart'], 'readwrite');
                    const cartStore = cartTransaction.objectStore('cart');
                    
                    const cartRequest = cartStore.get(productId);
                    
                    cartRequest.onsuccess = function() {
                        const existingItem = cartRequest.result;
                        if (existingItem) {
                            existingItem.quantity += 1;
                            cartStore.put(existingItem).onsuccess = resolve;
                        } else {
                            product.quantity = 1;
                            cartStore.add(product).onsuccess = resolve;
                        }
                        
                        updateCartCount();
                        showNotification('Товар добавлен в корзину');
                    };
                }
            };
        }).catch(reject);
    });
}

// Обновление счетчика корзины
function updateCartCount() {
    initDB().then(db => {
        const transaction = db.transaction(['cart'], 'readonly');
        const store = transaction.objectStore('cart');
        const request = store.count();

        request.onsuccess = function() {
            const count = request.result;
            document.querySelectorAll('#cart-count').forEach(el => {
                el.textContent = count;
            });
        };
    }).catch(console.error);
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Инициализация тестовых данных
function initializeSampleProducts() {
    const sampleProducts = [
        {
            id: 1,
            name: "Лавандовое мыло",
            description: "Успокаивающее мыло с натуральной лавандой",
            fullDescription: "Мыло с натуральным маслом лаванды обладает успокаивающим эффектом. Идеально подходит для вечернего использования.",
            features: ["Увлажняет кожу", "Антистресс-эффект", "Гипоаллергенно"],
            price: 350,
            category: "regular",
            image: "https://i.pinimg.com/736x/8f/77/51/8f775188416b88ea67b4bf981c15e489.jpg",
            badge: "Хит продаж"
        },
        {
            id: 2,
            name: "Антибактериальное с чайным деревом",
            description: "Защита от бактерий с маслом чайного дерева",
            fullDescription: "Мыло с маслом чайного дерева эффективно борется с бактериями и воспалениями. Рекомендуется для проблемной кожи.",
            features: ["Антибактериальный эффект", "Помогает при воспалениях", "Подходит для жирной кожи"],
            price: 420,
            category: "antibacterial",
            image: "https://i.pinimg.com/736x/7d/d6/be/7dd6be90d1d7dd978c71314ec7710a53.jpg",
            badge: "Новинка"
        }
    ];

    return new Promise((resolve, reject) {
        initDB().then(db => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            sampleProducts.forEach(product => {
                store.add(product);
            });

            transaction.oncomplete = () => resolve(sampleProducts);
            transaction.onerror = (event) => reject(event.target.error);
        }).catch(reject);
    });
}

// Обработка кликов по товарам
document.addEventListener('DOMContentLoaded', function() {
    // Клик по карточке товара
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard && !e.target.classList.contains('add-to-cart')) {
            const productId = productCard.getAttribute('data-id');
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        }
    });

    // Инициализация данных
    initDB().then(db => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const countRequest = store.count();

        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                initializeSampleProducts().catch(console.error);
            }
        };
    }).catch(console.error);

    updateCartCount();
});

// Стили для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
.notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: white;
    padding: 15px 30px;
    border-radius: 5px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1000;
}
.notification.show {
    opacity: 1;
}
`;
document.head.appendChild(notificationStyles);
