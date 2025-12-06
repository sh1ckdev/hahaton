// DashboardPage.jsx
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiTarget, FiShield, FiBell, FiPlus, FiChevronDown, FiLogOut } from "react-icons/fi";
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
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userStore.user && userStore.userId) {
      userStore.loadProfile();
      purchaseStore.loadForUser(userStore.userId);
      goalStore.loadForUser(userStore.userId);
    }
  }, [userStore, purchaseStore, goalStore]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        uiStore.closeUserMenu();
      }
    };

    if (uiStore.showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [uiStore.showUserMenu]);

  if (!userStore.user) return null;

  const name = userStore.user.nickname || userStore.user.userId;
  const salary = userStore.user.salary || 0;
  const spent = purchaseStore.currentMonthSpent;
  const percent = salary ? Math.min(100, Math.round((spent / salary) * 100)) : 0;
  const currentSavings = userStore.user.currentSavings || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] py-4 gap-4">
      {/* HEADER */}
      <header className="rounded-md border border-[#333333] bg-[#1A1A1A] px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#FFDD2D] flex items-center justify-center text-[#333333] font-extrabold text-lg shadow-md">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-[#333333] bg-[#FFDD2D] px-2 py-0.5 rounded-lg inline-flex w-fit font-semibold">
              smart spend
            </span>
            <div className="mt-1 text-xs text-white/60">Добро пожаловать,</div>
            <button
              onClick={() => uiStore.toggleUserMenu()}
              className="text-left group"
            >
              <div className="text-lg font-semibold leading-tight text-white group-hover:text-[#FFDD2D] transition-colors flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                {name}
                <FiChevronDown className={`w-4 h-4 transition-transform ${uiStore.showUserMenu ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* User Menu Dropdown */}
        {uiStore.showUserMenu && (
          <div
            ref={userMenuRef}
            className="absolute top-full left-4 mt-3 w-80 bg-[#1A1A1A] border border-[#333333] rounded-md shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
          >
            <div className="p-2">
              <div className="px-4 py-3 border-b border-[#333333] mb-2">
                <div className="text-xs text-white/50 mb-1">Меню пользователя</div>
                <div className="text-sm font-semibold text-white">{name}</div>
              </div>
              
              <div className="space-y-1">
                <Link
                  to="/profile"
                  onClick={() => uiStore.closeUserMenu()}
                  className="flex items-center gap-3 p-3 rounded-md bg-[#333333] hover:bg-[#444444] border border-transparent hover:border-[#FFDD2D]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md bg-[#FFDD2D]/10 flex items-center justify-center group-hover:bg-[#FFDD2D]/20 transition-colors">
                    <FiUser className="w-5 h-5 text-[#FFDD2D]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Личный кабинет</div>
                    <div className="text-xs text-white/50">Профиль и финансы</div>
                  </div>
                </Link>
                
                <Link
                  to="/goals"
                  onClick={() => uiStore.closeUserMenu()}
                  className="flex items-center gap-3 p-3 rounded-md bg-[#333333] hover:bg-[#444444] border border-transparent hover:border-[#FFDD2D]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md bg-[#FFDD2D]/10 flex items-center justify-center group-hover:bg-[#FFDD2D]/20 transition-colors">
                    <FiTarget className="w-5 h-5 text-[#FFDD2D]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Управлять целями</div>
                    <div className="text-xs text-white/50">Финансовые цели</div>
                  </div>
                </Link>
                
                <Link
                  to="/blacklist"
                  onClick={() => uiStore.closeUserMenu()}
                  className="flex items-center gap-3 p-3 rounded-md bg-[#333333] hover:bg-[#444444] border border-transparent hover:border-[#FFDD2D]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md bg-[#FFDD2D]/10 flex items-center justify-center group-hover:bg-[#FFDD2D]/20 transition-colors">
                    <FiShield className="w-5 h-5 text-[#FFDD2D]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Запрещённые категории</div>
                    <div className="text-xs text-white/50">Blacklist категорий</div>
                  </div>
                </Link>
                
                <Link
                  to="/notification-settings"
                  onClick={() => uiStore.closeUserMenu()}
                  className="flex items-center gap-3 p-3 rounded-md bg-[#333333] hover:bg-[#444444] border border-transparent hover:border-[#FFDD2D]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md bg-[#FFDD2D]/10 flex items-center justify-center group-hover:bg-[#FFDD2D]/20 transition-colors">
                    <FiBell className="w-5 h-5 text-[#FFDD2D]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Настройки уведомлений</div>
                    <div className="text-xs text-white/50">Уведомления и оповещения</div>
                  </div>
                </Link>
              </div>

              <div className="pt-2 mt-2 border-t border-[#333333]">
                <button
                  onClick={() => {
                    userStore.logout();
                    uiStore.closeUserMenu();
                    nav("/login");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-md bg-[#333333] hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <FiLogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-red-400">Выйти</div>
                    <div className="text-xs text-white/50">Выйти из аккаунта</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-[#FFDD2D] text-[#333333] font-semibold hover:bg-[#FFE855] transition-colors text-sm shadow-md flex items-center gap-2"
            onClick={() => uiStore.openAddPurchaseModal()}
          >
            <FiPlus className="w-4 h-4" />
            Добавить покупку
          </button>
        </div>
      </header>

      {/* TOP STRIP / HIGHLIGHT */}
      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#FFDD2D] via-[#FFE855] to-[#FFDD2D]/60" />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col gap-5">
        {/* SUMMARY CARDS */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* SPEND CARD */}
          <div className="relative overflow-hidden rounded-md border border-[#333333] bg-[#333333] p-4 sm:p-5 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFDD2D]/10 blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div>
                <div className="text-xs text-white/60 mb-1">
                  Траты в этом месяце
                </div>
                <div className="text-3xl sm:text-4xl font-semibold text-white">
                  {spent.toLocaleString()} ₽
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/60">Лимит месяца</div>
                <div className="text-sm font-medium text-white">
                  {salary.toLocaleString()} ₽
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-2 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wide text-white/60">
                  Использовано
                </span>
                <span className="text-xs font-medium text-white">
                  {percent}% бюджета
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent < 70
                      ? "bg-[#FFDD2D]"
                      : percent < 90
                      ? "bg-[#FFE855]"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-white/60">
                {percent < 70 && "Профиль расхода выглядит комфортно."}
                {percent >= 70 && percent < 90 && "Темп трат выше среднего — будь внимателен к импульсивным покупкам."}
                {percent >= 90 && "Бюджет почти исчерпан. Стоит временно сократить необязательные категории."}
              </div>
            </div>
          </div>

          {/* BALANCE / SAVINGS CARD */}
          <div className="rounded-md border border-[#333333] bg-[#333333] p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="text-xs text-white/60 mb-1.5">
                Текущий накопленный баланс
              </div>
              <div className="text-3xl sm:text-4xl font-semibold mb-2 text-white">
                {currentSavings.toLocaleString()} ₽
              </div>
            </div>
            <div className="mt-2 text-xs text-white/60 leading-relaxed">
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
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Цели
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333333]">
                финансовые цели
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/goals"
                className="text-xs text-[#FFDD2D] hover:opacity-80 transition"
              >
                Управлять →
              </Link>
              <span className="hidden sm:inline text-xs text-white/60">
                Крупные финансовые цели с приоритетами, которые учитываются при покупках.
              </span>
            </div>
          </div>
          <div className="rounded-md border border-[#333333] bg-[#333333] p-3 sm:p-4">
            <GoalsCarousel />
          </div>
        </section>

        {/* WISHLIST */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Wishlist
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333333]">
                период охлаждения
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-white/60">
              Добавляй хотелки сюда вместо мгновенной покупки.
            </span>
          </div>
          <div className="rounded-md border border-[#333333] bg-[#333333] p-3 sm:p-4">
            <WishlistCarousel />
          </div>
        </section>

        {/* Финансовые цели из анкеты */}
        {userStore.user?.extendedProfile?.financialGoals && (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Мои финансовые цели
              </h2>
            </div>
            <div className="rounded-md border border-[#333333] bg-[#333333] p-4">
              <p className="text-sm text-white/90 whitespace-pre-wrap">
                {userStore.user.extendedProfile.financialGoals}
              </p>
            </div>
          </section>
        )}

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
