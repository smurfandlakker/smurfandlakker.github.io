// db.js - Работа с IndexedDB
const DB_NAME = 'SoapFantasyDB';
const DB_VERSION = 2;

// Структура базы данных
const DB_STORES = {
  PRODUCTS: 'products',
  CART: 'cart',
  ORDERS: 'orders',
  REVIEWS: 'reviews'
};

// Инициализация базы данных
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Ошибка при открытии DB:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Создаем хранилище для товаров
      if (!db.objectStoreNames.contains(DB_STORES.PRODUCTS)) {
        const productsStore = db.createObjectStore(DB_STORES.PRODUCTS, { keyPath: 'id' });
        productsStore.createIndex('category', 'category', { unique: false });
      }

      // Создаем хранилище для корзины
      if (!db.objectStoreNames.contains(DB_STORES.CART)) {
        db.createObjectStore(DB_STORES.CART, { keyPath: 'id' });
      }

      // Создаем хранилище для заказов
      if (!db.objectStoreNames.contains(DB_STORES.ORDERS)) {
        const ordersStore = db.createObjectStore(DB_STORES.ORDERS, { keyPath: 'id', autoIncrement: true });
        ordersStore.createIndex('email', 'email', { unique: false });
        ordersStore.createIndex('date', 'date', { unique: false });
      }

      // Создаем хранилище для отзывов
      if (!db.objectStoreNames.contains(DB_STORES.REVIEWS)) {
        const reviewsStore = db.createObjectStore(DB_STORES.REVIEWS, { keyPath: 'id', autoIncrement: true });
        reviewsStore.createIndex('productId', 'productId', { unique: false });
      }
    };
  });
}

// Базовые операции с хранилищами
const dbOperations = {
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      initDB().then(db => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      }).catch(reject);
    });
  },

  getById(storeName, id) {
    return new Promise((resolve, reject) => {
      initDB().then(db => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      }).catch(reject);
    });
  },

  add(storeName, item) {
    return new Promise((resolve, reject) => {
      initDB().then(db => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      }).catch(reject);
    });
  },

  update(storeName, item) {
    return new Promise((resolve, reject) => {
      initDB().then(db => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      }).catch(reject);
    });
  },

  delete(storeName, id) {
    return new Promise((resolve, reject) => {
      initDB().then(db => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      }).catch(reject);
    });
  }
};

// Специфические функции для работы с товарами
export const loadProducts = (category = null) => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.PRODUCTS], 'readonly');
      const store = transaction.objectStore(DB_STORES.PRODUCTS);
      let request;

      if (category) {
        const index = store.index('category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        // Добавляем mock-данные, если база пуста
        if (request.result.length === 0) {
          initializeSampleProducts().then(resolve).catch(reject);
        } else {
          resolve(request.result);
        }
      };
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};

// Функции для работы с корзиной
export const getCartItems = () => dbOperations.getAll(DB_STORES.CART);
export const addToCart = (product) => dbOperations.add(DB_STORES.CART, product);
export const updateCartItem = (item) => dbOperations.update(DB_STORES.CART, item);
export const removeFromCart = (id) => dbOperations.delete(DB_STORES.CART, id);
export const clearCart = () => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.CART], 'readwrite');
      const store = transaction.objectStore(DB_STORES.CART);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};

// Функции для работы с заказами
export const addOrder = (order) => dbOperations.add(DB_STORES.ORDERS, order);
export const getOrdersByEmail = (email) => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.ORDERS], 'readonly');
      const store = transaction.objectStore(DB_STORES.ORDERS);
      const index = store.index('email');
      const request = index.getAll(email);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};

// Функции для работы с отзывами
export const addReview = (review) => dbOperations.add(DB_STORES.REVIEWS, review);
export const getProductReviews = (productId) => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.REVIEWS], 'readonly');
      const store = transaction.objectStore(DB_STORES.REVIEWS);
      const index = store.index('productId');
      const request = index.getAll(productId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};

// Инициализация тестовых данных
function initializeSampleProducts() {
  const sampleProducts = [
    {
      id: 1,
      name: "Лавандовое мыло",
      description: "Успокаивающее мыло с натуральной лавандой",
      fullDescription: "Мыло с натуральным маслом лаванды обладает успокаивающим эффектом. Идеально подходит для вечернего использования.",
      features: [
        "Увлажняет кожу",
        "Антистресс-эффект",
        "Гипоаллергенно"
      ],
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
      features: [
        "Антибактериальный эффект",
        "Помогает при воспалениях",
        "Подходит для жирной кожи"
      ],
      price: 420,
      category: "antibacterial",
      image: "https://i.pinimg.com/736x/7d/d6/be/7dd6be90d1d7dd978c71314ec7710a53.jpg",
      badge: "Новинка"
    }
  ];

  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.PRODUCTS], 'readwrite');
      const store = transaction.objectStore(DB_STORES.PRODUCTS);
      
      sampleProducts.forEach(product => {
        store.add(product);
      });

      transaction.oncomplete = () => resolve(sampleProducts);
      transaction.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

// Инициализация базы данных при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initDB().catch(console.error);
});
