// db.js
const DB_NAME = 'SoapFantasyDB';
const DB_VERSION = 2;

const sampleProducts = [
  {
    id: 1,
    name: "Лавандовое мыло",
    description: "Успокаивающее мыло с натуральной лавандой",
    fullDescription: "Мыло с натуральным маслом лаванды обладает успокаивающим эффектом. Идеально подходит для вечернего использования. Содержит только натуральные ингредиенты без химических добавок.",
    features: ["Увлажняет кожу", "Антистресс-эффект", "Гипоаллергенно", "100% натуральный состав"],
    price: 350,
    category: "regular",
    image: "https://i.imgur.com/KZJ8zNq.jpg",
    badge: "Хит продаж"
  },
  {
    id: 2,
    name: "Антибактериальное с чайным деревом",
    description: "Защита от бактерий с маслом чайного дерева",
    fullDescription: "Мыло с маслом чайного дерева эффективно борется с бактериями и воспалениями. Рекомендуется для проблемной кожи. Обладает выраженным антисептическим действием.",
    features: ["Антибактериальный эффект", "Помогает при воспалениях", "Подходит для жирной кожи", "Натуральные эфирные масла"],
    price: 420,
    category: "antibacterial",
    image: "https://i.imgur.com/7Q5W6lF.jpg",
    badge: "Новинка"
  },
  {
    id: 3,
    name: "Медовое мыло с прополисом",
    description: "Питательное мыло с натуральным медом",
    fullDescription: "Мыло с натуральным медом и прополисом обладает питательными и антисептическими свойствами. Отлично подходит для сухой и чувствительной кожи.",
    features: ["Питает кожу", "Заживляет мелкие повреждения", "Натуральный состав", "Антисептические свойства"],
    price: 380,
    category: "regular",
    image: "https://i.imgur.com/9p3R5vM.jpg"
  },
  {
    id: 4,
    name: "Кофейный скраб",
    description: "Очищающее мыло с кофейной гущей",
    fullDescription: "Мыло с натуральной кофейной гущей мягко отшелушивает кожу, улучшает кровообращение и борется с целлюлитом. Идеально для утреннего душа.",
    features: ["Эффективный скраб", "Улучшает кровообращение", "Борется с целлюлитом", "Натуральные компоненты"],
    price: 390,
    category: "regular",
    image: "https://i.imgur.com/2X1Yj5t.jpg"
  },
  {
    id: 5,
    name: "Цитрусовый заряд",
    description: "Бодрящее мыло с цитрусовыми маслами",
    fullDescription: "Мыло с натуральными цитрусовыми маслами дарит заряд бодрости на весь день. Освежает и тонизирует кожу, поднимает настроение.",
    features: ["Тонизирует кожу", "Освежающий аромат", "Подходит для утреннего использования", "Энергетический заряд"],
    price: 370,
    category: "regular",
    image: "https://i.imgur.com/L4k9m8P.jpg"
  },
  {
    id: 6,
    name: "Антибактериальное с эвкалиптом",
    description: "Освежающее мыло с эвкалиптовым маслом",
    fullDescription: "Мыло с эвкалиптовым маслом обладает сильным антибактериальным эффектом, освежает и очищает кожу. Особенно рекомендуется в сезон простуд.",
    features: ["Антибактериальный эффект", "Освежающее действие", "Помогает при простудах", "Натуральные компоненты"],
    price: 400,
    category: "antibacterial",
    image: "https://i.imgur.com/VvJ7h3Q.jpg"
  }
];

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Ошибка при открытии DB:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Проверяем наличие товаров
      const checkProducts = () => {
        const tx = db.transaction(['products'], 'readonly');
        const store = tx.objectStore('products');
        store.count().onsuccess = (e) => {
          if (e.target.result === 0) {
            addSampleProducts(db);
          }
        };
      };
      checkProducts();
      resolve(db);
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
      
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('email', 'email', { unique: false });
      }
    };
  });
}

function addSampleProducts(db) {
  const tx = db.transaction(['products'], 'readwrite');
  const store = tx.objectStore('products');
  
  sampleProducts.forEach(product => {
    store.add(product);
  });
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

export function loadProducts(category = null) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const tx = db.transaction(['products'], 'readonly');
      const store = tx.objectStore('products');
      let request;

      if (category) {
        const index = store.index('category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result || sampleProducts);
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
