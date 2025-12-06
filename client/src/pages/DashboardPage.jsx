// DashboardPage.jsx
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import InitialBlacklistModal from "../components/InitialBlacklistModal.jsx";
import GoalsCarousel from "../components/GoalsCarousel.jsx";
import WishlistCarousel from "../components/WishlistCarousel.jsx";
import ChatFloatingButton from "../components/ChatFloatingButton.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import AddPurchaseModal from "../components/AddPurchaseModal.jsx";

const DashboardPage = observer(() => {
  const { userStore, purchaseStore, uiStore, goalStore } = useStores();
  const [chatOpen, setChat] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!userStore.user && userStore.userId) {
      userStore.loadProfile();
      purchaseStore.loadForUser(userStore.userId);
      goalStore.loadForUser(userStore.userId);
    }
  }, [userStore, purchaseStore, goalStore]);

  if (!userStore.user) return null;

  console.log(userStore.user)

  const name = userStore.user.nickname || userStore.user.userId;
  const salary = userStore.user.salary || 0;
  const spent = purchaseStore.currentMonthSpent;
  const percent = salary ? Math.min(100, Math.round((spent / salary) * 100)) : 0;
  const currentSavings = userStore.user.currentSavings || 0;

  return (
    <div className="min-h-screen flex flex-col py-4 gap-4">
      {/* HEADER */}
      <header className="rounded-2xl border border-gray-900 bg-gray-900/80 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_0_2px_#111]">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-gray-700 bg-primary px-2 py-0.5 rounded-full inline-flex w-fit">
              smart spend
            </span>
            <div className="mt-1 text-xs text-gray-400">Добро пожаловать,</div>
            <div className="text-lg font-semibold leading-tight">
              {name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-full bg-primary text-black font-semibold hover:bg-yellow-300 transition text-sm"
            onClick={() => uiStore.openAddPurchaseModal()}
          >
            + Добавить покупку
          </button>
          <button
            className="hidden sm:inline-flex items-center text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
            onClick={() => nav("/blacklist")}
          >
            Редактировать blacklist
          </button>
          <button
            className="inline-flex sm:hidden items-center text-xs px-3 py-1.5 rounded-full bg-gray-800 text-gray-100"
            onClick={() => nav("/blacklist")}
          >
            Blacklist
          </button>
        </div>
      </header>

      {/* TOP STRIP / HIGHLIGHT */}
      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col gap-5">
        {/* SUMMARY CARDS */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* SPEND CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-900 bg-gray-900/90 p-4 sm:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.9)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Траты в этом месяце
                </div>
                <div className="text-3xl sm:text-4xl font-semibold">
                  {spent.toLocaleString()} ₽
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Лимит месяца</div>
                <div className="text-sm font-medium">
                  {salary.toLocaleString()} ₽
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-2 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Использовано
                </span>
                <span className="text-xs font-medium text-gray-200">
                  {percent}% бюджета
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent < 70
                      ? "bg-primary"
                      : percent < 90
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-gray-500">
                {percent < 70 && "Профиль расхода выглядит комфортно."}
                {percent >= 70 && percent < 90 && "Темп трат выше среднего — будь внимателен к импульсивным покупкам."}
                {percent >= 90 && "Бюджет почти исчерпан. Стоит временно сократить необязательные категории."}
              </div>
            </div>
          </div>

          {/* BALANCE / SAVINGS CARD */}
          <div className="rounded-2xl border border-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 sm:p-5 flex flex-col justify-between shadow-[0_18px_50px_rgba(0,0,0,0.8)]">
            <div>
              <div className="text-xs text-gray-400 mb-1.5">
                Текущий накопленный баланс
              </div>
              <div className="text-3xl sm:text-4xl font-semibold mb-2">
                {currentSavings.toLocaleString()} ₽
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 leading-relaxed">
              На основе того, сколько ты откладываешь и уже накопил,
              ассистент подсказывает, когда крупные хотелки станут комфортными
              и какие траты сейчас мешают этому.
            </div>
          </div>
        </section>

        {/* GOALS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Цели
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-900 text-gray-400 border border-gray-800">
                финансовые цели
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/goals"
                className="text-xs text-primary hover:opacity-80 transition"
              >
                Управлять →
              </Link>
              <span className="hidden sm:inline text-xs text-gray-500">
                Крупные финансовые цели с приоритетами, которые учитываются при покупках.
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-900 bg-gray-900/80 p-3 sm:p-4">
            <GoalsCarousel />
          </div>
        </section>

        {/* WISHLIST */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Wishlist
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-900 text-gray-400 border border-gray-800">
                период охлаждения
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-gray-500">
              Добавляй хотелки сюда вместо мгновенной покупки.
            </span>
          </div>
          <div className="rounded-2xl border border-gray-900 bg-gray-900/80 p-3 sm:p-4">
            <WishlistCarousel />
          </div>
        </section>

        {/* Финансовые цели из анкеты */}
        {userStore.user?.extendedProfile?.financialGoals && (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Мои финансовые цели
              </h2>
            </div>
            <div className="rounded-2xl border border-gray-900 bg-gray-900/80 p-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {userStore.user.extendedProfile.financialGoals}
              </p>
            </div>
          </section>
        )}

        {/* SETTINGS LINKS */}
        <div className="pt-1 space-y-2">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition"
          >
            <span>Личный кабинет</span>
            <span className="text-base leading-none">↗</span>
          </Link>
          <Link
            to="/goals"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition"
          >
            <span>Управлять целями</span>
            <span className="text-base leading-none">↗</span>
          </Link>
          <Link
            to="/blacklist"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition"
          >
            <span>Управлять запрещёнными категориями</span>
            <span className="text-base leading-none">↗</span>
          </Link>
          <div>
            <Link
              to="/notification-settings"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition"
            >
              <span>Настройки уведомлений</span>
              <span className="text-base leading-none">↗</span>
            </Link>
          </div>
        </div>
      </main>

      {uiStore.showInitialBlacklistModal && <InitialBlacklistModal />}
      {uiStore.showAddPurchaseModal && (
        <AddPurchaseModal onClose={() => uiStore.closeAddPurchaseModal()} />
      )}

      <ChatFloatingButton onClick={() => setChat(true)} />
      <ChatPanel open={chatOpen} onClose={() => setChat(false)} />
    </div>
  );
});

export default DashboardPage;
