import { callOpenRouter, isOpenRouterAvailable } from "./openRouterService.js";

// Кэш для результатов (чтобы не запрашивать одно и то же)
const categoryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 час

// Проверяем доступность OpenRouter
const openRouterAvailable = isOpenRouterAvailable();
if (openRouterAvailable) {
  console.log("✅ OpenRouter доступен");
} else {
  console.log("⚠️ OpenRouter недоступен");
}

// Улучшенный fallback
const localFallback = (text) => {
  text = text.toLowerCase();

  const categories = [
    { patterns: [/playstation|xbox|steam|игра|game|nintendo/], category: "игры" },
    { patterns: [/телефон|смартфон|iphone|android/, /ноутбук|laptop|macbook/, /пк|компьютер|pc/], category: "техника" },
    { patterns: [/одежд|куртк|пальто|джинс|футболк|рубашк/], category: "одежда" },
    { patterns: [/подписк|netflix|spotify|яндекс.музык|кино|стрим/], category: "развлечения" },
    { patterns: [/поездк|авиабилет|отель|путешеств|тур|отпуск/], category: "путешествия" },
    { patterns: [/еда|ресторан|кафе|продукт|супермаркет|магазин/], category: "еда" },
    { patterns: [/транспорт|такси|бензин|заправк|автобус|метро/], category: "транспорт" },
  ];

  for (const { patterns, category } of categories) {
    if (patterns.some(pattern => pattern.test(text))) {
      return category;
    }
  }

  return "другое";
};

// Функция с ретраями для OpenRouter
async function callOpenRouterWithRetry(prompt, retries = 2, maxTokens = 200) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Attempt ${attempt} to call OpenRouter...`);
      
      const completion = await callOpenRouter(
        [{ role: "user", content: prompt }],
        {
          maxTokens,
          temperature: 0.6,
          stream: false
        }
      );

      return completion;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt <= retries) {
        // Ждем перед повторной попыткой (экспоненциальная backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// ---- NEW: AI генерация категорий blacklist ----

export const generateBlacklist = async (contextText = "") => {
  if (!openRouterAvailable) {
    console.log("⚠ AI недоступен — возвращаю fallback категории");
    return ["игры", "подписки", "фастфуд", "шмот", "онлайн покупки", "развлечения"];
  }

  const prompt = `
  Ты финансовый ассистент. Твоя задача — определить категории расходов пользователя, которые стоит ограничить для улучшения бюджета.
  
  === ДАННЫЕ О ПОЛЬЗОВАТЕЛЕ ===
  ${contextText}
  
  === ЗАДАЧА ===
  На основе данных выше выбери категории трат, которые у пользователя могут быть избыточными, импульсивными, несоразмерными доходу или не соответствуют его финансовым целям.
  
  === АНАЛИЗ ===
  1. ОБЯЗАТЕЛЬНО включи категории, которые пользователь сам отметил как:
     - "На что тратит больше всего" (если это необязательные траты)
     - "Импульсивные категории"
     - "Категории, мешающие целям"
  
  2. Учитывай финансовые цели:
     - Если цель требует накоплений → ограничь категории, которые мешают накоплениям
     - Если есть долги → приоритет категориям, которые можно сократить для погашения долгов
  
  3. Учитывай процент отложений:
     - Если процент низкий (< 10%) → больше категорий для ограничения
     - Если процент высокий (> 30%) → меньше категорий, только самые проблемные
  
  4. Если зарплата низкая относительно трат → больше категорий для ограничения
  
  === КАТЕГОРИИ (ориентируйся на них, можно перефразировать близко к смыслу) ===
  "Рестораны и кафе",
  "Фастфуд",
  "Кофе навынос",
  "Доставка еды",
  "Такси и каршеринг",
  "Подписки и сервисы",
  "Онлайн-шопинг",
  "Развлечения",
  "Игры и внутриигровые покупки",
  "Алкоголь и табак",
  "Электроника и гаджеты",
  "Одежда и аксессуары (брендовая)",
  "Красота и уход",
  "Путешествия",
  "Хобби (дорогостоящие)",
  "Криптовалюты и рисковые инвестиции",
  "Микрозаймы и проценты",
  "Премиум-связь или интернет",
  "Автокредит/лизинг"
  
  === ПРАВИЛА ===
  1. Используй только категории (строки).
  2. Минимум 7 категорий, если в данных есть хоть какая-то информация.
  3. Приоритет категориям, которые пользователь сам отметил как проблемные.
  4. Если данных мало — выбери самые вероятные категории для среднего пользователя.
  5. Если данных нет — верни [].
  6. Ответ строго в формате JSON массива строк, без пояснений и текста до/после.
  
  === ОТВЕТ (строго JSON) ===
  `
  

  try {
    const completion = await callOpenRouterWithRetry(prompt);

    let text = completion?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty AI response");

    // пробуем распарсить как JSON
    const clean = text.replace(/```json|```|\n/g,"");
    const list = JSON.parse(clean);

    if (Array.isArray(list) && list.length) return list;
    return ["игры","фастфуд","подписки"]; // fallback
  } catch {
    return ["игры","азарт","пицца","подписки","одежда"]; // fallback
  }
};

export const classifyCategory = async (title = "", description = "") => {
  const text = `${title} ${description}`.trim();
  
  // Проверяем кэш
  const cacheKey = text.toLowerCase();
  const cached = categoryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📚 Using cached category for: "${text.substring(0, 50)}..."`);
    return cached.category;
  }

  // Если нет OpenRouter, используем fallback
  if (!openRouterAvailable) {
    const category = localFallback(text);
    console.log(`🤖 Fallback category for "${text}": ${category}`);
    return category;
  }

  try {
    const prompt = `Определи категорию покупки: "${text}"
    
Доступные категории: игры, техника, одежда, развлечения, путешествия, другое
Верни только одно слово из списка.`;

    console.log(`📤 Requesting AI classification for: "${text.substring(0, 100)}..."`);

    const completion = await callOpenRouterWithRetry(prompt);
    
    const out = completion?.choices?.[0]?.message?.content?.trim()?.toLowerCase();
    
    if (!out) {
      throw new Error("Empty response from AI");
    }

    // Валидация
    const allowed = ["игры", "техника", "одежда", "развлечения", "путешествия", "другое"];
    let category = allowed.includes(out) ? out : localFallback(text);
    
    // Сохраняем в кэш
    categoryCache.set(cacheKey, {
      category,
      timestamp: Date.now()
    });
    
    // Очистка старых записей в кэше
    if (categoryCache.size > 1000) {
      const oldestKey = categoryCache.keys().next().value;
      categoryCache.delete(oldestKey);
    }
    
    console.log(`✅ Category: "${text}" → ${category}`);
    return category;

  } catch (err) {
    console.error(`❌ AI failed for "${text}":`, err.message);
    
    const fallbackCategory = localFallback(text);
    console.log(`🔄 Using fallback: ${fallbackCategory}`);
    
    return fallbackCategory;
  }
};

// Генерация AI совета для подтверждения покупки
// goalsWithShift - массив целей с информацией о сдвиге: [{title, price, shiftDays}, ...]
export const generatePurchaseConfirmationAdvice = async (user, purchase, goalsWithShift = []) => {
  if (!openRouterAvailable) {
    // Fallback без AI
    let fallbackText = `Ты собираешься купить "${purchase.title}" за ${purchase.price}₽.`;
    if (goalsWithShift.length > 0) {
      fallbackText += `\n\nЕсли подтвердишь эту покупку, твои цели сдвинутся:`;
      goalsWithShift.forEach(goal => {
        fallbackText += `\n- "${goal.title}" отложится на ${goal.shiftDays} дней`;
      });
    }
    fallbackText += `\n\nПодтверди покупку или добавь в вишлист?`;
    return fallbackText;
  }

  try {
    let context = `Пользователь получил транзакцию на покупку "${purchase.title}" стоимостью ${purchase.price}₽.`;
    
    // Определяем категорию (приоритет AI категории, затем обычной)
    const category = purchase.aiCategory || purchase.category;
    if (category) {
      context += ` Категория покупки: ${category}.`;
    }
    
    if (purchase.description) {
      context += ` Описание: ${purchase.description}.`;
    }

    if (goalsWithShift.length > 0) {
      context += `\n\nУ пользователя есть финансовые цели, которые пострадают от этой покупки (чем меньше число приоритета, тем важнее цель):`;
      goalsWithShift.forEach(goal => {
        context += `\n- "${goal.title}" (${goal.price}₽, приоритет ${goal.priority}) - сдвинется на ${goal.shiftDays} дней`;
      });
    }

    if (user.salary) {
      const salaryPercentage = ((purchase.price / user.salary) * 100).toFixed(0);
      context += `\n\nЗарплата пользователя: ${user.salary}₽/месяц. Покупка составляет ${salaryPercentage}% от месячного дохода.`;
    }

    if (user.currentSavings) {
      context += ` Текущие накопления: ${user.currentSavings}₽.`;
    }

    const prompt = `Ты финансовый ассистент, который помогает пользователям принимать разумные финансовые решения.

${context}

Задача: Сгенерируй дружелюбный, краткий (2-4 предложения) совет на русском языке. ОБЯЗАТЕЛЬНО упомяни категорию покупки, если она указана. Укажи точный процент от зарплаты, если он рассчитан. Спроси, действительно ли пользователь хочет подтвердить эту покупку прямо сейчас, или лучше добавить её в вишлист (отложить на потом). 

Если есть информация о сдвиге финансовых целей - обязательно упомяни конкретные цели и на сколько дней они сдвинутся. Особое внимание уделяй целям с высоким приоритетом (меньшее число приоритета = более важная цель). Это важный фактор для принятия решения.

Будь дружелюбным, но честным. Не используй markdown разметку, только обычный текст.`;

    const completion = await callOpenRouterWithRetry(prompt, 2, 250);
    const advice = completion?.choices?.[0]?.message?.content?.trim();
    
    return advice || generatePurchaseConfirmationAdvice(user, purchase, goalsWithShift); // рекурсивный fallback
  } catch (err) {
    console.error("❌ AI advice generation failed:", err.message);
    // Fallback
    let fallbackText = `Ты собираешься купить "${purchase.title}" за ${purchase.price}₽.`;
    if (goalsWithShift.length > 0) {
      fallbackText += `\n\nЕсли подтвердишь эту покупку, твои цели сдвинутся:`;
      goalsWithShift.forEach(goal => {
        fallbackText += `\n- "${goal.title}" отложится на ${goal.shiftDays} дней`;
      });
    }
    fallbackText += `\n\nПодтверди покупку или добавь в вишлист?`;
    return fallbackText;
  }
};
