// Этот файл содержит функции для работы с IndexedDB

// Функция для получения всех товаров в корзине
function getCartItems() {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['cart'], 'readonly');
            const store = transaction.objectStore('cart');
            const request = store.getAll();

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

// Функция для обновления количества товара в корзине
function updateCartItemQuantity(productId, quantity) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['cart'], 'readwrite');
            const store = transaction.objectStore('cart');
            const request = store.get(productId);

            request.onsuccess = function() {
                const item = request.result;
                if (item) {
                    if (quantity <= 0) {
                        // Удаляем товар, если количество <= 0
                        const deleteRequest = store.delete(productId);
                        deleteRequest.onsuccess = function() {
                            resolve();
                            updateCartCount();
                        };
                        deleteRequest.onerror = function(event) {
                            reject(event.target.error);
                        };
                    } else {
                        // Обновляем количество
                        item.quantity = quantity;
                        const updateRequest = store.put(item);
                        updateRequest.onsuccess = function() {
                            resolve();
                            updateCartCount();
                        };
                        updateRequest.onerror = function(event) {
                            reject(event.target.error);
                        };
                    }
                } else {
                    reject(new Error('Товар не найден в корзине'));
                }
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Функция для удаления товара из корзины
function removeFromCart(productId) {
    return updateCartItemQuantity(productId, 0);
}

// Функция для оформления заказа
function placeOrder(orderData) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['orders', 'cart'], 'readwrite');
            const ordersStore = transaction.objectStore('orders');
            const cartStore = transaction.objectStore('cart');

            // Добавляем заказ
            const orderRequest = ordersStore.add({
                ...orderData,
                date: new Date().toISOString(),
                status: 'new'
            });

            orderRequest.onsuccess = function() {
                // Очищаем корзину
                const clearCartRequest = cartStore.clear();
                clearCartRequest.onsuccess = function() {
                    resolve();
                    updateCartCount();
                };
                clearCartRequest.onerror = function(event) {
                    reject(event.target.error);
                };
            };

            orderRequest.onerror = function(event) {
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Функция для добавления отзыва
function addReview(reviewData) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['reviews'], 'readwrite');
            const store = transaction.objectStore('reviews');
            const request = store.add(reviewData);

            request.onsuccess = function() {
                resolve();
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Функция для получения отзывов по ID продукта
function getProductReviews(productId) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['reviews'], 'readonly');
            const store = transaction.objectStore('reviews');
            const index = store.index('productId');
            const request = index.getAll(productId);

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

// Функция для получения всех отзывов
function getAllReviews() {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(['reviews'], 'readonly');
            const store = transaction.objectStore('reviews');
            const request = store.getAll();

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