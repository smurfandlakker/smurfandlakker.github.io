// db.js
const DB_NAME = 'SoapFantasyDB';
const DB_VERSION = 3;

const sampleProducts = [
  {
    id: 1,
    name: "Лавандовое мыло",
    description: "Успокаивающее мыло с натуральной лавандой",
    fullDescription: "Мыло с натуральным маслом лаванды обладает успокаивающим эффектом. Идеально подходит для вечернего использования.",
    features: ["Увлажняет кожу", "Антистресс-эффект", "Гипоаллергенно"],
    price: 350,
    category: "regular",
    image: "https://i.imgur.com/KZJ8zNq.jpg",
    badge: "Хит продаж"
  },
  {
    id: 2,
    name: "Антибактериальное с чайным деревом",
    description: "Защита от бактерий с маслом чайного дерева",
    fullDescription: "Мыло с маслом чайного дерева эффективно борется с бактериями и воспалениями.",
    features: ["Антибактериальный эффект", "Помогает при воспалениях"],
    price: 420,
    category: "antibacterial",
    image: "https://i.imgur.com/7Q5W6lF.jpg",
    badge: "Новинка"
  }
];

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      checkProducts(db).then(() => resolve(db));
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
      }
    };
  });
}

function checkProducts(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    store.count().onsuccess = (e) => {
      if (e.target.result === 0) {
        addSampleProducts(db).then(resolve);
      } else {
        resolve();
      }
    };
  });
}

function addSampleProducts(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    sampleProducts.forEach(product => {
      store.add(product);
    });
    
    tx.oncomplete = () => resolve();
  });
}

export function loadProducts(category = null) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      let request;

      if (category) {
        const index = store.index('category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

export function addToCart(productId) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['products', 'cart'], 'readwrite');
      const productsStore = tx.objectStore('products');
      const cartStore = tx.objectStore('cart');

      productsStore.get(productId).onsuccess = (e) => {
        const product = e.target.result;
        if (product) {
          cartStore.get(productId).onsuccess = (e) => {
            const item = e.target.result || {...product, quantity: 0};
            item.quantity += 1;
            cartStore.put(item).onsuccess = resolve;
          };
        }
      };
    }).catch(reject);
  });
}

export function getCartItems() {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['cart'], 'readonly');
      const store = tx.objectStore('cart');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

export function removeFromCart(productId) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['cart'], 'readwrite');
      const store = tx.objectStore('cart');
      const request = store.delete(productId);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

export function updateCartItemQuantity(productId, quantity) {
  return new Promise((resolve, reject) => {
    if (quantity <= 0) {
      return removeFromCart(productId).then(resolve).catch(reject);
    }

    initDB().then(db => {
      const tx = db.transaction(['cart'], 'readwrite');
      const store = tx.objectStore('cart');
      
      store.get(productId).onsuccess = (e) => {
        const item = e.target.result;
        if (item) {
          item.quantity = quantity;
          store.put(item).onsuccess = resolve;
        }
      };
    }).catch(reject);
  });
}

export function placeOrder(orderData) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['orders', 'cart'], 'readwrite');
      const ordersStore = tx.objectStore('orders');
      const cartStore = tx.objectStore('cart');
      
      // Добавляем заказ
      const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Новый',
        email: orderData.email,
        customer: orderData.name,
        address: orderData.address,
        phone: orderData.phone,
        items: orderData.items
      };
      
      ordersStore.add(order);
      
      // Очищаем корзину
      cartStore.clear();
      
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

export function getOrdersByEmail(email) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['orders'], 'readonly');
      const store = tx.objectStore('orders');
      const index = store.index('email');
      const request = index.getAll(email);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initDB().catch(console.error);
});
// Добавить в db.js после других функций

function addReview(review) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction(['reviews'], 'readwrite');
            const store = tx.objectStore('reviews');
            const request = store.add(review);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        }).catch(reject);
    });
}

function getAllReviews() {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const tx = db.transaction(['reviews'], 'readonly');
            const store = tx.objectStore('reviews');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        }).catch(reject);
    });
}

// Обновить функцию initDB() - добавить хранилище для отзывов
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    
    if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
    }
    
    if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
    }
    
    if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('email', 'email', { unique: false });
    }
    
    if (!db.objectStoreNames.contains('reviews')) {
        db.createObjectStore('reviews', { autoIncrement: true });
    }
};
