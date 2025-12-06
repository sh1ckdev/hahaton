import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiDollarSign, FiTarget, FiTrendingUp, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

const ProfilePage = observer(() => {
  const { userStore, purchaseStore } = useStores();
  const nav = useNavigate();

  useEffect(() => {
    if (!userStore.user) {
      nav("/login");
      return;
    }
    purchaseStore.loadForUser(userStore.userId);
  }, [userStore.user, userStore.userId]);

  if (!userStore.user) return null;

  const user = userStore.user;
  const allPurchases = purchaseStore.purchases || [];
  const purchased = allPurchases.filter(p => p.status === "purchased");
  const canceled = allPurchases.filter(p => p.status === "canceled");
  const planned = allPurchases.filter(p => p.status === "planned");

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <header className="px-4 py-3 border-b border-[#333333] bg-[#1A1A1A] flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="flex items-center gap-2 text-sm text-white hover:text-[#FFDD2D] transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <FiUser className="w-5 h-5 text-[#FFDD2D]" />
          <span className="font-semibold text-white">Личный кабинет</span>
        </div>
        <div className="w-20" />
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Финансовый профайл */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FiDollarSign className="w-5 h-5 text-[#FFDD2D]" />
            <h3 className="text-lg font-semibold text-white">Финансовый профайл</h3>
          </div>
          <div className="bg-[#333333] border border-[#555555] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <FiTrendingUp className="w-5 h-5 text-[#FFDD2D]" />
                <span className="text-white/70">Зарплата в месяц:</span>
              </div>
              <span className="font-semibold text-white">{user.salary?.toLocaleString() || 0} ₽</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <FiTarget className="w-5 h-5 text-[#FFDD2D]" />
                <span className="text-white/70">Откладываю в месяц:</span>
              </div>
              <span className="font-semibold text-white">{user.savingsPerMonth?.toLocaleString() || 0} ₽</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <FiDollarSign className="w-5 h-5 text-[#FFDD2D]" />
                <span className="text-white/70">Текущие накопления:</span>
              </div>
              <span className="font-semibold text-white">{user.currentSavings?.toLocaleString() || 0} ₽</span>
            </div>
          </div>
        </section>

        {/* Финансовые цели из анкеты */}
        {user.extendedProfile?.financialGoals && (
          <section>
            <h3 className="text-lg font-semibold mb-3 text-white">Мои финансовые цели</h3>
            <div className="bg-[#333333] border border-[#555555] rounded-md p-4">
              <p className="text-white/90 whitespace-pre-wrap">
                {user.extendedProfile.financialGoals}
              </p>
            </div>
          </section>
        )}

        {/* Статистика покупок */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FiShoppingCart className="w-5 h-5 text-[#FFDD2D]" />
            <h3 className="text-lg font-semibold text-white">Статистика покупок</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#333333] border border-[#555555] rounded-md p-4 text-center">
              <div className="w-10 h-10 rounded-md bg-[#FFDD2D]/10 flex items-center justify-center mx-auto mb-2">
                <FiClock className="w-5 h-5 text-[#FFDD2D]" />
              </div>
              <div className="text-2xl font-semibold text-[#FFDD2D]">{planned.length}</div>
              <div className="text-xs text-white/60 mt-1">Запланировано</div>
            </div>
            <div className="bg-[#333333] border border-[#555555] rounded-md p-4 text-center">
              <div className="w-10 h-10 rounded-md bg-green-400/10 flex items-center justify-center mx-auto mb-2">
                <FiCheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-semibold text-green-400">{purchased.length}</div>
              <div className="text-xs text-white/60 mt-1">Куплено</div>
            </div>
            <div className="bg-[#333333] border border-[#555555] rounded-md p-4 text-center">
              <div className="w-10 h-10 rounded-md bg-red-400/10 flex items-center justify-center mx-auto mb-2">
                <FiXCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-2xl font-semibold text-red-400">{canceled.length}</div>
              <div className="text-xs text-white/60 mt-1">Отменено</div>
            </div>
          </div>
        </section>

        {/* История покупок */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-white">История покупок</h3>
          <div className="space-y-2">
            {allPurchases.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-4">
                Пока нет покупок
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allPurchases.map(purchase => (
                  <div
                    key={purchase._id}
                    className="bg-[#333333] border border-[#555555] rounded-md p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{purchase.title}</div>
                        {purchase.category && (
                          <div className="text-xs text-white/60 mt-1">
                            Категория: {purchase.category}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{purchase.price?.toLocaleString()} ₽</div>
                        <div className={`text-xs mt-1 ${
                          purchase.status === "purchased" ? "text-green-400" :
                          purchase.status === "canceled" ? "text-red-400" :
                          "text-[#FFDD2D]"
                        }`}>
                          {purchase.status === "purchased" ? "Куплено" :
                           purchase.status === "canceled" ? "Отменено" :
                           "Запланировано"}
                        </div>
                      </div>
                    </div>
                    {purchase.createdAt && (
                      <div className="text-xs text-white/50">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
});

export default ProfilePage;

