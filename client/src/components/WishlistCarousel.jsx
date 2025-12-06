import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useState } from "react";
import { FiHeart, FiBell, FiBellOff } from "react-icons/fi";

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
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FiHeart className="w-12 h-12 text-white/20 mb-3" />
        <div className="text-sm text-white/60">
          Wishlist пуст. Добавь хотели через ассистента/бэк.
        </div>
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
            className="min-w-[260px] bg-[#1A1A1A] border border-[#444444] rounded-lg p-3 flex-shrink-0 relative"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <div className="text-sm font-semibold text-white">{w.title}</div>
                <div className="text-xs text-white/60">{w.category}</div>
              </div>
              <button
                onClick={() => setOpenId(openId === w._id ? null : w._id)}
                className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                  notifyEnabled
                    ? "bg-[#FFDD2D] text-[#333333] border-[#FFDD2D]"
                    : "bg-[#333333] text-white/60 border-[#555555] hover:bg-[#444444]"
                }`}
                title="Уведомлять о покупке"
              >
                {notifyEnabled ? (
                  <FiBell className="w-4 h-4" />
                ) : (
                  <FiBellOff className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-sm text-white mb-2 font-medium">
              {w.price.toLocaleString()} ₽
            </div>

            {cooldown && (
              <div className="text-xs text-white/60">
                Можно будет купить после{" "}
                <span className="text-[#FFDD2D]">
                  {cooldown.toLocaleDateString()}
                </span>
              </div>
            )}

            {openId === w._id && (
              <div className="absolute right-2 top-10 bg-[#333333] border border-[#555555] rounded-lg p-2 text-xs z-10 w-52 shadow-xl">
                <div className="mb-1 text-white">Настройки уведомлений</div>
                <div className="space-y-1">
                  {intervals.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        handleToggleNotify(w, true, opt.value)
                      }
                      className={`w-full text-left px-2 py-1 rounded-lg transition-colors ${
                        notifyEnabled && notifyEveryDays === opt.value
                          ? "bg-[#FFDD2D] text-[#333333]"
                          : "bg-[#1A1A1A] text-white hover:bg-[#444444]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleToggleNotify(w, false)}
                    className="w-full text-left px-2 py-1 rounded-lg bg-[#1A1A1A] text-white/60 hover:bg-[#444444] border border-[#555555] mt-1 transition-colors"
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
