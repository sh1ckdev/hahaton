import Purchase from "../models/Purchase.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { isDateInPast } from "../utils/cooldownCalc.js";
import { now } from "../utils/date.js";

const SCHEDULE_MS = 1000 * 60 * 60; // каждый час (для демо)

export const checkAndCreateNotifications = async () => {
  const users = await User.find({});
  const current = now();

  for (const user of users) {
    const settings = user.notificationSettings || {};
    const { frequency, excludeCategories, excludePurchaseIds, channels, channel } = settings;
    
    // Обратная совместимость: если есть старое поле channel, используем его
    const activeChannels = channels && channels.length > 0 ? channels : (channel ? [channel] : ["ui"]);
    
    if (!frequency || !activeChannels || activeChannels.length === 0) continue;

    const query = {
      userId: user.userId,
      status: "planned",
      blockedByCategory: { $ne: true },
      category: { $nin: excludeCategories || [] }
    };
    
    // Исключаем конкретные покупки, если указаны
    if (excludePurchaseIds && excludePurchaseIds.length > 0) {
      const mongoose = (await import("mongoose")).default;
      query._id = { $nin: excludePurchaseIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const purchases = await Purchase.find(query);

    for (const p of purchases) {
      // не напоминаем слишком часто — по частоте
      if (p.lastNotifiedAt) {
        const diff = current.getTime() - new Date(p.lastNotifiedAt).getTime();
        const dayMs = 86400000;
        if (
          (frequency === "daily" && diff < dayMs) ||
          (frequency === "weekly" && diff < 7 * dayMs) ||
          (frequency === "monthly" && diff < 30 * dayMs)
        ) {
          continue;
        }
      }

      // спрашиваем только, если период охлаждения прошёл
      const cooldownOk = !p.cooldownUntil || isDateInPast(p.cooldownUntil);

      if (!cooldownOk) continue;

      const message = `Ты всё ещё хочешь купить "${p.title}" за ${p.price}?`;

      await Notification.create({
        userId: user.userId,
        purchaseId: p._id.toString(),
        message
      });

      p.lastNotifiedAt = current;
      await p.save();

      // в реальном проекте тут отправка e-mail/telegram
      console.log(`[NOTIFY] user=${user.userId} purchase=${p.title}`);
    }
  }
};

let timer = null;

export const startNotificationScheduler = () => {
  if (timer) return;
  timer = setInterval(checkAndCreateNotifications, SCHEDULE_MS);
  console.log("Notification scheduler started");
};
