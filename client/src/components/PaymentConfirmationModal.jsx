import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useStores } from "../stores/StoreProvider.jsx";
import { money } from "../utils/formatMoney.js";
import api from "../api/client.js";

const PaymentConfirmationModal = observer(() => {
  const { uiStore, purchaseStore } = useStores();
  
  // Запрашиваем AI совет при открытии модального окна
  useEffect(() => {
    if (uiStore.showPaymentConfirmationModal && uiStore.pendingPurchase && uiStore.loadingAdvice && uiStore.pendingPurchase._id) {
      const purchase = uiStore.pendingPurchase;
      api.get(`/ai/purchase-advice/${purchase._id}`)
        .then(res => {
          uiStore.setPurchaseAdvice(
            res.data.advice,
            res.data.affectedGoals || []
          );
        })
        .catch(err => {
          console.error("Failed to load AI advice:", err);
          uiStore.setPurchaseAdvice(
            `Ты собираешься купить "${purchase.title}" за ${money(purchase.price)}. Подтверди покупку или добавь в вишлист?`,
            []
          );
        });
    }
  }, [uiStore.showPaymentConfirmationModal, uiStore.pendingPurchase?._id, uiStore.loadingAdvice]);

  if (!uiStore.showPaymentConfirmationModal || !uiStore.pendingPurchase) return null;

  const purchase = uiStore.pendingPurchase;

  const handleConfirm = async () => {
    try {
      await purchaseStore.confirmPurchase(purchase._id);
      uiStore.closePaymentConfirmationModal();
    } catch (err) {
      console.error("Failed to confirm purchase:", err);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await purchaseStore.addToWishlist(purchase._id);
      uiStore.closePaymentConfirmationModal();
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
    }
  };

  const handleClose = () => {
    uiStore.closePaymentConfirmationModal();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#16181d] border border-[#26292f] rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            💳 Новая транзакция
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Название</div>
            <div className="text-lg font-medium text-white">{purchase.title}</div>
          </div>

          {purchase.description && (
            <div>
              <div className="text-sm text-gray-400 mb-1">Описание</div>
              <div className="text-sm text-gray-300">{purchase.description}</div>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-400 mb-1">Сумма</div>
            <div className="text-2xl font-semibold text-yellow-400">
              {money(purchase.price)}
            </div>
          </div>

          {(purchase.aiCategory || purchase.category) && (
            <div>
              <div className="text-sm text-gray-400 mb-1">Категория</div>
              <div className="inline-block px-3 py-1 rounded-full text-sm bg-[#1d1f24] text-gray-200 border border-[#31343a]">
                {purchase.aiCategory || purchase.category}
              </div>
            </div>
          )}

          {/* AI Совет */}
          <div className="pt-4 border-t border-[#26292f]">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-yellow-400 mb-2">
                  Совет ассистента:
                </div>
                {uiStore.loadingAdvice ? (
                  <div className="text-sm text-gray-400 italic">
                    Ассистент анализирует покупку...
                  </div>
                ) : uiStore.purchaseAdvice ? (
                  <div className="text-sm text-gray-200 whitespace-pre-line">
                    {uiStore.purchaseAdvice}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Информация о сдвиге целей */}
            {uiStore.affectedGoals && uiStore.affectedGoals.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                <div className="text-xs text-yellow-400 font-semibold mb-2">
                  ⚠️ Влияние на твои цели
                </div>
                <div className="space-y-2">
                  {uiStore.affectedGoals.map((goal, idx) => (
                    <div key={idx} className="text-sm text-gray-200">
                      <span className="font-semibold">"{goal.title}"</span> отложится на <span className="font-semibold text-yellow-400">{goal.shiftDays} дней</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm bg-[#1f2126] text-gray-300 hover:bg-[#2a2d33] transition"
          >
            Отмена
          </button>
          <button
            onClick={handleAddToWishlist}
            disabled={uiStore.loadingAdvice}
            className="px-4 py-2 rounded-xl text-sm bg-[#2a2d33] text-gray-200 hover:bg-[#353840] transition disabled:opacity-50"
          >
            В вишлист
          </button>
          <button
            onClick={handleConfirm}
            disabled={uiStore.loadingAdvice}
            className="px-4 py-2 rounded-xl text-sm bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
});

export default PaymentConfirmationModal;
