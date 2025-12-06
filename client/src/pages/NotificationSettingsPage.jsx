import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const NotificationSettingsPage = observer(() => {
  const { userStore, purchaseStore } = useStores();
  const nav = useNavigate();
  
  const [frequency, setFrequency] = useState("weekly");
  const [channels, setChannels] = useState(["ui"]);
  const [excludePurchaseIds, setExcludePurchaseIds] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userStore.user) return;
    
    const settings = userStore.user.notificationSettings || {};
    setFrequency(settings.frequency || "weekly");
    setChannels(settings.channels || ["ui"]);
    setExcludePurchaseIds(settings.excludePurchaseIds || []);
    
    if (settings.emailSettings) {
      setEmailEnabled(settings.emailSettings.enabled || false);
      setEmail(settings.emailSettings.email || "");
    }
    
    if (settings.telegramSettings) {
      setTelegramEnabled(settings.telegramSettings.enabled || false);
      setTelegramChatId(settings.telegramSettings.chatId || "");
    }
  }, [userStore.user]);

  useEffect(() => {
    purchaseStore.loadForUser(userStore.userId);
  }, [userStore.userId]);

  const toggleChannel = (channel) => {
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleExcludePurchase = (purchaseId) => {
    setExcludePurchaseIds(prev =>
      prev.includes(purchaseId)
        ? prev.filter(id => id !== purchaseId)
        : [...prev, purchaseId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post(`/users/${userStore.userId}/notification-settings`, {
        frequency,
        channels,
        excludePurchaseIds,
        emailSettings: {
          enabled: emailEnabled,
          email: emailEnabled ? email : ""
        },
        telegramSettings: {
          enabled: telegramEnabled,
          chatId: telegramEnabled ? telegramChatId : ""
        }
      });
      
      await userStore.loadProfile();
      nav("/");
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
      // Если пользователь не найден - logout произойдет автоматически через loadProfile
      if (error.response?.status === 404 || error.response?.status === 401) {
        return; // loadProfile уже вызовет logout
      }
      alert("Ошибка при сохранении настроек");
    } finally {
      setLoading(false);
    }
  };

  if (!userStore.user) return null;

  const plannedPurchases = purchaseStore.purchases.filter(p => p.status === "planned");

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <header className="px-4 py-3 border-b border-[#333333] bg-[#1A1A1A] flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="text-sm text-white hover:text-[#FFDD2D] transition-colors"
        >
          ← Назад
        </button>
        <div className="font-semibold text-white">Настройки уведомлений</div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Частота опроса */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-white">Частота опроса о покупках</h3>
          <div className="space-y-2">
            {[
              { value: "daily", label: "Ежедневно" },
              { value: "weekly", label: "Еженедельно" },
              { value: "monthly", label: "Ежемесячно" }
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={opt.value}
                  checked={frequency === opt.value}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Каналы нотификации */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-white">Каналы уведомлений</h3>
          <div className="space-y-2">
            {[
              { value: "ui", label: "Уведомления в приложении" },
              { value: "email", label: "Email (SMTP)" },
              { value: "telegram", label: "Telegram" }
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes(opt.value)}
                  onChange={() => toggleChannel(opt.value)}
                  className="w-4 h-4"
                />
                <span className="text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Настройки Email */}
        {channels.includes("email") && (
          <section className="bg-[#333333] p-4 rounded-md border border-[#555555]">
            <h3 className="text-lg font-semibold mb-3 text-white">Настройки Email</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white">Включить уведомления на Email</span>
              </label>
              {emailEnabled && (
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#555555] px-3 py-2 rounded-md text-white"
                />
              )}
            </div>
          </section>
        )}

        {/* Настройки Telegram */}
        {channels.includes("telegram") && (
          <section className="bg-[#333333] p-4 rounded-md border border-[#555555]">
            <h3 className="text-lg font-semibold mb-3 text-white">Настройки Telegram</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white">Включить уведомления в Telegram</span>
              </label>
              {telegramEnabled && (
                <input
                  type="text"
                  placeholder="Chat ID или username"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#555555] px-3 py-2 rounded-md text-white"
                />
              )}
            </div>
          </section>
        )}

        {/* Исключения товаров */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-white">Исключить товары из уведомлений</h3>
          <p className="text-sm text-white/70 mb-3">
            Выберите товары, о которых не нужно напоминать
          </p>
          {plannedPurchases.length === 0 ? (
            <p className="text-white/60 text-sm">Нет запланированных покупок</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {plannedPurchases.map(purchase => (
                <label
                  key={purchase._id}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[#333333] rounded border border-[#555555] bg-[#1A1A1A]"
                >
                  <input
                    type="checkbox"
                    checked={excludePurchaseIds.includes(purchase._id)}
                    onChange={() => toggleExcludePurchase(purchase._id)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1 text-white">
                    {purchase.title} - {purchase.price}₽
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-3 rounded-md bg-[#FFDD2D] text-[#333333] font-semibold hover:bg-[#FFE855] disabled:opacity-50 transition-colors"
        >
          {loading ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </main>
    </div>
  );
});

export default NotificationSettingsPage;

