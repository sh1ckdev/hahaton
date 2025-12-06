import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Назад
        </button>
        <div className="font-semibold">Личный кабинет</div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Финансовый профайл */}
        <section>
          <h3 className="text-lg font-semibold mb-3">Финансовый профайл</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Зарплата в месяц:</span>
              <span className="font-semibold">{user.salary?.toLocaleString() || 0} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Откладываю в месяц:</span>
              <span className="font-semibold">{user.savingsPerMonth?.toLocaleString() || 0} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Текущие накопления:</span>
              <span className="font-semibold">{user.currentSavings?.toLocaleString() || 0} ₽</span>
            </div>
          </div>
        </section>

        {/* Финансовые цели из анкеты */}
        {user.extendedProfile?.financialGoals && (
          <section>
            <h3 className="text-lg font-semibold mb-3">Мои финансовые цели</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-200 whitespace-pre-wrap">
                {user.extendedProfile.financialGoals}
              </p>
            </div>
          </section>
        )}

        {/* Статистика покупок */}
        <section>
          <h3 className="text-lg font-semibold mb-3">Статистика покупок</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-semibold text-primary">{planned.length}</div>
              <div className="text-xs text-slate-400 mt-1">Запланировано</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-semibold text-green-400">{purchased.length}</div>
              <div className="text-xs text-slate-400 mt-1">Куплено</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-semibold text-red-400">{canceled.length}</div>
              <div className="text-xs text-slate-400 mt-1">Отменено</div>
            </div>
          </div>
        </section>

        {/* История покупок */}
        <section>
          <h3 className="text-lg font-semibold mb-3">История покупок</h3>
          <div className="space-y-2">
            {allPurchases.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Пока нет покупок
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allPurchases.map(purchase => (
                  <div
                    key={purchase._id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold">{purchase.title}</div>
                        {purchase.category && (
                          <div className="text-xs text-slate-400 mt-1">
                            Категория: {purchase.category}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{purchase.price?.toLocaleString()} ₽</div>
                        <div className={`text-xs mt-1 ${
                          purchase.status === "purchased" ? "text-green-400" :
                          purchase.status === "canceled" ? "text-red-400" :
                          "text-yellow-400"
                        }`}>
                          {purchase.status === "purchased" ? "Куплено" :
                           purchase.status === "canceled" ? "Отменено" :
                           "Запланировано"}
                        </div>
                      </div>
                    </div>
                    {purchase.createdAt && (
                      <div className="text-xs text-slate-500">
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

