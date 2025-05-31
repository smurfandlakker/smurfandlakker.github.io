// db.js
const DB_NAME = 'SoapFantasyDB';
const DB_VERSION = 1;

const DB_STORES = {
  PRODUCTS: 'products',
  CART: 'cart',
  ORDERS: 'orders',
  REVIEWS: 'reviews'
};

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
      
      if (!db.objectStoreNames.contains(DB_STORES.PRODUCTS)) {
        const productsStore = db.createObjectStore(DB_STORES.PRODUCTS, { keyPath: 'id' });
        productsStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(DB_STORES.CART)) {
        db.createObjectStore(DB_STORES.CART, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(DB_STORES.ORDERS)) {
        const ordersStore = db.createObjectStore(DB_STORES.ORDERS, { keyPath: 'id', autoIncrement: true });
        ordersStore.createIndex('email', 'email', { unique: false });
      }

      if (!db.objectStoreNames.contains(DB_STORES.REVIEWS)) {
        const reviewsStore = db.createObjectStore(DB_STORES.REVIEWS, { keyPath: 'id', autoIncrement: true });
        reviewsStore.createIndex('productId', 'productId', { unique: false });
      }
    };
  });
}

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
    },
    {
      id: 3,
      name: "Медовое мыло с прополисом",
      description: "Питательное мыло с натуральным медом",
      fullDescription: "Мыло с натуральным медом и прополисом обладает питательными и антисептическими свойствами.",
      features: ["Питает кожу", "Заживляет мелкие повреждения", "Натуральный состав"],
      price: 380,
      category: "regular",
      image: "https://i.pinimg.com/736x/65/5b/53/655b53a1f727a252ddfa46b6c4f29c2e.jpg"
    }
  ];

  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.PRODUCTS], 'readwrite');
      const store = transaction.objectStore(DB_STORES.PRODUCTS);
      
      // Очищаем существующие данные
      store.clear();
      
      // Добавляем новые товары
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
  initDB().then(db => {
    const transaction = db.transaction([DB_STORES.PRODUCTS], 'readonly');
    const store = transaction.objectStore(DB_STORES.PRODUCTS);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        initializeSampleProducts().catch(console.error);
      }
    };
  }).catch(console.error);
});

// Экспортируемые функции
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

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};

export const addToCart = (productId) => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.PRODUCTS, DB_STORES.CART], 'readwrite');
      const productsStore = transaction.objectStore(DB_STORES.PRODUCTS);
      const cartStore = transaction.objectStore(DB_STORES.CART);

      productsStore.get(productId).onsuccess = (event) => {
        const product = event.target.result;
        if (product) {
          cartStore.get(productId).onsuccess = (e) => {
            const existingItem = e.target.result;
            if (existingItem) {
              existingItem.quantity += 1;
              cartStore.put(existingItem).onsuccess = resolve;
            } else {
              product.quantity = 1;
              cartStore.add(product).onsuccess = resolve;
            }
          };
        }
      };
    }).catch(reject);
  });
};

export const getCartItems = () => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction([DB_STORES.CART], 'readonly');
      const store = transaction.objectStore(DB_STORES.CART);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => reject(event.target.error);
    }).catch(reject);
  });
};
