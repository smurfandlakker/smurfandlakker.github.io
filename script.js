// Инициализация базы данных
function initDB() {
    return new Promise((resolve, reject) => {
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

            // Создаем хранилище для продуктов
            const productsStore = db.createObjectStore('products', { keyPath: 'id' });
            productsStore.createIndex('category', 'category', { unique: false });

            // Создаем хранилище для корзины
            const cartStore = db.createObjectStore('cart', { keyPath: 'id' });

            // Создаем хранилище для отзывов
            const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
            reviewsStore.createIndex('productId', 'productId', { unique: false });

            // Создаем хранилище для заказов
            const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
        };
    });
}

// Загрузка продуктов из базы данных
function loadProducts(category = null) {
    return new Promise((resolve, reject) => {
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
                resolve(request.result);
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Загрузка избранных продуктов на главную страницу
function loadFeaturedProducts() {
    loadProducts().then(products => {
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) {
            // Выбираем 4 случайных продукта
            const featuredProducts = products.sort(() => 0.5 - Math.random()).slice(0, 4);
            
            featuredContainer.innerHTML = featuredProducts.map(product => `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="product-price">${product.price} ₽</div>
                        <button class="add-to-cart" data-id="${product.id}">В корзину</button>
                    </div>
                </div>
            `).join('');

            // Добавляем обработчики событий для кнопок "В корзину"
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-id'));
                    addToCart(productId);
                });
            });
        }
    }).catch(error => {
        console.error('Ошибка при загрузке продуктов:', error);
    });
}

// Добавление товара в корзину
function addToCart(productId) {
    initDB().then(db => {
        // Сначала получаем информацию о продукте
        const transaction = db.transaction(['products'], 'readonly');
        const productsStore = transaction.objectStore('products');
        const request = productsStore.get(productId);

        request.onsuccess = function() {
            const product = request.result;
            if (product) {
                // Теперь добавляем в корзину
                const cartTransaction = db.transaction(['cart'], 'readwrite');
                const cartStore = cartTransaction.objectStore('cart');
                
                // Проверяем, есть ли уже такой товар в корзине
                const cartRequest = cartStore.get(productId);
                
                cartRequest.onsuccess = function() {
                    const existingItem = cartRequest.result;
                    if (existingItem) {
                        // Увеличиваем количество
                        existingItem.quantity += 1;
                        cartStore.put(existingItem);
                    } else {
                        // Добавляем новый товар
                        product.quantity = 1;
                        cartStore.add(product);
                    }
                    
                    updateCartCount();
                    showNotification('Товар добавлен в корзину');
                };
                
                cartRequest.onerror = function(event) {
                    console.error('Ошибка при добавлении в корзину:', event.target.error);
                };
            }
        };

        request.onerror = function(event) {
            console.error('Ошибка при получении продукта:', event.target.error);
        };
    }).catch(error => {
        console.error('Ошибка при добавлении в корзину:', error);
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
            const cartCountElements = document.querySelectorAll('#cart-count');
            cartCountElements.forEach(element => {
                element.textContent = count;
            });
        };
    }).catch(error => {
        console.error('Ошибка при обновлении счетчика корзины:', error);
    });
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Инициализация базы данных с тестовыми данными (выполняется один раз)
function initializeWithSampleData() {
    initDB().then(db => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const countRequest = store.count();

        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                // База данных пуста, добавляем тестовые данные
                const sampleProducts = [
                    {
                        id: 1,
                        name: 'Лавандовое мыло',
                        description: 'Успокаивающее мыло с натуральной лавандой',
                        price: 350,
                        category: 'regular',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    },
                    {
                        id: 2,
                        name: 'Медовое мыло',
                        description: 'Питательное мыло с натуральным медом',
                        price: 380,
                        category: 'regular',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    },
                    {
                        id: 3,
                        name: 'Антибактериальное с чайным деревом',
                        description: 'Защита от бактерий с маслом чайного дерева',
                        price: 420,
                        category: 'antibacterial',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    },
                    {
                        id: 4,
                        name: 'Цитрусовый заряд',
                        description: 'Бодрящее мыло с цитрусовыми маслами',
                        price: 370,
                        category: 'regular',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    },
                    {
                        id: 5,
                        name: 'Антибактериальное с эвкалиптом',
                        description: 'Очищающее мыло с эвкалиптовым маслом',
                        price: 400,
                        category: 'antibacterial',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    },
                    {
                        id: 6,
                        name: 'Кофейный скраб',
                        description: 'Мыло-скраб с кофейной гущей',
                        price: 390,
                        category: 'regular',
                        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
                    }
                ];

                const addTransaction = db.transaction(['products'], 'readwrite');
                const addStore = addTransaction.objectStore('products');
                
                sampleProducts.forEach(product => {
                    addStore.add(product);
                });
            }
        };
    }).catch(error => {
        console.error('Ошибка при инициализации базы данных:', error);
    });
}

// Вызов инициализации при первой загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeWithSampleData();
    updateCartCount();
});

// Добавление стилей для уведомлений
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