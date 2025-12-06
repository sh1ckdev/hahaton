import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import { classifyCategory } from "./aiService.js";
import { getUserCooldownRules } from "./userService.js";
import { getCooldownDaysForAmount, calcComfortableFrom, isDateInPast } from "../utils/cooldownCalc.js";
import { checkBlacklistByText } from "../utils/blacklist.js";
import { addDays, now } from "../utils/date.js";

export const listPurchasesByUser = (userId) =>
  Purchase.find({ userId }).sort({ createdAt: -1 });

export const getPurchaseById = (id) => Purchase.findById(id);

export const createPurchase = async (user, payload) => {
  const { title, price, category, useAiCategory, description, url } = payload;

  let finalTitle = title;
  let finalCategory = category || "другое";
  let aiCategory = null;

  // Если есть URL, пытаемся извлечь информацию из него
  if (url && !title) {
    // Простой парсинг - можно улучшить через специальный сервис
    try {
      // Пытаемся извлечь название из URL (например, из Ozon, Wildberries и т.д.)
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Для популярных магазинов можно добавить специфичную логику
      if (hostname.includes('ozon.ru')) {
        finalTitle = `Товар с Ozon${urlObj.pathname ? ` - ${urlObj.pathname.split('/').pop()}` : ''}`;
      } else if (hostname.includes('wildberries.ru')) {
        finalTitle = `Товар с Wildberries${urlObj.pathname ? ` - ${urlObj.pathname.split('/').pop()}` : ''}`;
      } else {
        finalTitle = `Товар с ${hostname}`;
      }
    } catch (e) {
      // Если не удалось распарсить URL, используем исходное название
      finalTitle = title || "Товар";
    }
  }

  if (useAiCategory || !category) {
    aiCategory = await classifyCategory(finalTitle, description || url || "");
    finalCategory = aiCategory;
  }

  const rules = await getUserCooldownRules(user.userId);
  const cooldownDays = getCooldownDaysForAmount(rules, price);
  const cooldownUntil = cooldownDays ? addDays(now(), cooldownDays) : null;
  const comfortableFrom = calcComfortableFrom(user, price);

  const blacklistMatched = checkBlacklistByText(finalCategory, title);
  const blockedByCategory = !!blacklistMatched;

  const status = blockedByCategory ? "canceled" : "planned";

  const purchase = await Purchase.create({
    userId: user.userId,
    title: finalTitle,
    price,
    category: finalCategory,
    aiCategory,
    url: url || undefined,
    cooldownUntil,
    comfortableFrom,
    blacklistMatched,
    blockedByCategory,
    status
  });

  return purchase;
};

export const cancelPurchase = async (id) => {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  purchase.status = "canceled";
  await purchase.save();
  return purchase;
};

export const markPurchaseAsBought = async (id) => {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  purchase.status = "purchased";
  await purchase.save();
  
  // Обновляем накопления пользователя
  const user = await User.findOne({ userId: purchase.userId });
  if (user && user.currentSavings >= purchase.price) {
    user.currentSavings -= purchase.price;
    await user.save();
  }
  
  return purchase;
};

export const isPurchaseAllowedNow = (purchase) => {
  if (purchase.blockedByCategory) return false;
  const cooldownOk = !purchase.cooldownUntil || isDateInPast(purchase.cooldownUntil);
  const comfortOk = !purchase.comfortableFrom || isDateInPast(purchase.comfortableFrom);
  return cooldownOk && comfortOk;
};

export const updateLastNotified = async (purchase) => {
  purchase.lastNotifiedAt = now();
  await purchase.save();
  return purchase;
};
