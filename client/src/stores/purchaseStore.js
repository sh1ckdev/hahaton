import { makeAutoObservable, runInAction } from "mobx";
import api from "../api/client";

export class PurchaseStore {
  purchases = [];
  loading = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, {}, { autoBind: true }); // важно
  }

  get wishlist() {
    return this.purchases.filter(p => p.status === "planned");
  }

  get currentMonthSpent() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.purchases
      .filter(p => p.status === "purchased" && new Date(p.updatedAt || p.createdAt) >= start)
      .reduce((sum, p) => sum + p.price, 0);
  }

  async loadForUser(userId) {
    this.loading = true;
    try {
      const res = await api.get(`/purchases/${userId}`);
      runInAction(() => { this.purchases = res.data; });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async toggleWishlistNotification(purchaseId, enabled, intervalDays) {
    try {
      const res = await api.patch(`/purchases/notification/${purchaseId}`, {
        notifyEnabled: enabled,
        notifyEveryDays: intervalDays
      });
      runInAction(() => {
        this.purchases = this.purchases.map(p =>
          p._id === purchaseId ? res.data : p
        );
      });
    } catch (e) { console.error(e); }
  }

  // Подтвердить покупку (пометить как купленную)
  async confirmPurchase(purchaseId) {
    try {
      const res = await api.post(`/purchases/bought/${purchaseId}`);
      runInAction(() => {
        this.purchases = this.purchases.map(p =>
          p._id === purchaseId ? res.data : p
        );
      });
      // Перезагружаем данные пользователя, чтобы обновить накопления
      if (this.root.userStore.userId) {
        await this.root.userStore.loadProfile();
      }
    } catch (e) {
      console.error("Failed to confirm purchase:", e);
      throw e;
    }
  }

  // Добавить в вишлист (оставить статус planned)
  async addToWishlist(purchaseId) {
    try {
      // Покупка уже имеет статус "planned" по умолчанию при создании
      // Обновляем конкретную покупку для синхронизации
      runInAction(() => {
        this.purchases = this.purchases.map(p =>
          p._id === purchaseId ? { ...p, status: "planned" } : p
        );
      });
      // Перезагружаем список для полной синхронизации
      if (this.root.userStore.userId) {
        await this.loadForUser(this.root.userStore.userId);
      }
    } catch (e) {
      console.error("Failed to add to wishlist:", e);
      throw e;
    }
  }

  // 🔔 подписка на SSE (вебхуки/поток)
  connectBankStream(userId) {
    const ev = new EventSource(`http://localhost:5000/api/payments/stream/${userId}`);

    ev.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "NEW_PURCHASE") {
        runInAction(() => this.purchases.unshift(data.purchase));
        // Показываем модальное окно подтверждения платежа
        this.root.uiStore.openPaymentConfirmationModal(data.purchase);
      }
    };

    ev.onerror = (err) => {
      console.warn("SSE connection lost", err);
      // можно реализовать авто-reconnect
    };

    return ev; // чтобы можно было закрыть ev.close()
  }
}
