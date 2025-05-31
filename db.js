// db.js
const DB_NAME = 'SoapFantasyDB';
const DB_VERSION = 1;

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
  },
  {
    id: 4,
    name: "Цитрусовый заряд",
    description: "Бодрящее мыло с цитрусовыми маслами",
    fullDescription: "Мыло с натуральными цитрусовыми маслами дарит заряд бодрости на весь день.",
    features: ["Тонизирует кожу", "Освежающий аромат", "Подходит для утреннего использования"],
    price: 370,
    category: "regular",
    image: "https://i.pinimg.com/736x/27/5f/0c/275f0c8e8a7a2f0b8b0e7e8a7a2f0b8b.jpg"
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

export const loadProducts = (category = null) => {
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
};

export const addToCart = (productId) => {
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
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initDB().catch(console.error);
});
