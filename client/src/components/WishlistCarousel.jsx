import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useState } from "react";

const intervals = [
  { label: "Каждый день", value: 1 },
  { label: "Раз в неделю", value: 7 },
  { label: "Раз в месяц", value: 30 }
];

const WishlistCarousel = observer(() => {
  const { purchaseStore } = useStores();
  const wishlist = purchaseStore.wishlist;
  const [openId, setOpenId] = useState(null);

  if (!wishlist.length)
    return (
      <div className="text-sm text-slate-500">
        Wishlist пуст. Добавь хотели через ассистента/бэк.
      </div>
    );

  const handleToggleNotify = async (item, enabled, days) => {
    const interval = enabled ? days || 7 : null; // по умолчанию неделя
    await purchaseStore.toggleWishlistNotification(item._id, enabled, interval);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {wishlist.map((w) => {
        const cooldown = w.cooldownUntil ? new Date(w.cooldownUntil) : null;

        // предполагаем, что с бэка приходят поля:
        const notifyEnabled = w.notifyEnabled;
        const notifyEveryDays = w.notifyEveryDays || 7;

        return (
          <div
            key={w._id}
            className="min-w-[260px] bg-slate-900 border border-slate-800 rounded-2xl p-3 flex-shrink-0 relative"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <div className="text-sm font-semibold">{w.title}</div>
                <div className="text-xs text-slate-400">{w.category}</div>
              </div>
              <button
                onClick={() => setOpenId(openId === w._id ? null : w._id)}
                className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs ${
                  notifyEnabled
                    ? "bg-primary text-black border-primary"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
                title="Уведомлять о покупке"
              >
                🔔
              </button>
            </div>
            <div className="text-sm text-slate-200 mb-2">
              {w.price.toLocaleString()} ₽
            </div>

            {cooldown && (
              <div className="text-xs text-slate-400">
                Можно будет купить после{" "}
                <span className="text-primary">
                  {cooldown.toLocaleDateString()}
                </span>
              </div>
            )}

            {openId === w._id && (
              <div className="absolute right-2 top-10 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs z-10 w-52 shadow-xl">
                <div className="mb-1 text-slate-200">Настройки уведомлений</div>
                <div className="space-y-1">
                  {intervals.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        handleToggleNotify(w, true, opt.value)
                      }
                      className={`w-full text-left px-2 py-1 rounded-lg ${
                        notifyEnabled && notifyEveryDays === opt.value
                          ? "bg-primary text-black"
                          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleToggleNotify(w, false)}
                    className="w-full text-left px-2 py-1 rounded-lg bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700 mt-1"
                  >
                    Не напоминать
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default WishlistCarousel;
