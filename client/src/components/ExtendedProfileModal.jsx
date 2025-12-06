import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useState } from "react";
import api from "../api/client";

// Категории для анкеты
const SPENDING_CATEGORIES = [
  "Рестораны и кафе",
  "Фастфуд",
  "Кофе навынос",
  "Доставка еды",
  "Такси и каршеринг",
  "Подписки и сервисы",
  "Онлайн-шопинг",
  "Развлечения",
  "Игры и внутриигровые покупки",
  "Алкоголь и табак",
  "Электроника и гаджеты",
  "Одежда и аксессуары",
  "Красота и уход",
  "Путешествия",
  "Хобби",
  "Другое"
];

const ExtendedProfileModal = observer(({ onComplete }) => {
  const { userStore } = useStores();
  
  // Шаг 1: На что тратит больше всего
  const [topSpending, setTopSpending] = useState([]);
  
  // Шаг 2: Импульсивные категории
  const [impulsiveCategories, setImpulsiveCategories] = useState([]);
  
  // Шаг 3: Финансовые цели
  const [financialGoals, setFinancialGoals] = useState("");
  
  // Шаг 4: Категории, мешающие целям
  const [blockingCategories, setBlockingCategories] = useState([]);
  
  // Шаг 5: Процент отложений
  const [savingsPercentage, setSavingsPercentage] = useState(20);
  
  // Шаг 6: Долги
  const [hasDebts, setHasDebts] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

  const toggleCategory = (category, setter, current) => {
    setter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Формируем контекст для AI
      const contextText = `
Зарплата: ${userStore.user?.salary || 0}₽/месяц
Откладывает: ${userStore.user?.savingsPerMonth || 0}₽/месяц
Текущие накопления: ${userStore.user?.currentSavings || 0}₽

На что тратит больше всего: ${topSpending.join(", ")}
Импульсивные категории: ${impulsiveCategories.join(", ")}
Финансовые цели: ${financialGoals || "не указаны"}
Категории, мешающие целям: ${blockingCategories.join(", ")}
Процент отложений: ${savingsPercentage}%
Есть долги: ${hasDebts ? "да" : "нет"}
      `.trim();

      // Сохраняем данные анкеты в профиль пользователя
      await api.post(`/users/${userStore.userId}/profile`, {
        extendedProfile: {
          topSpendingCategories: topSpending,
          impulsiveCategories: impulsiveCategories,
          financialGoals: financialGoals,
          blockingCategories: blockingCategories,
          savingsPercentage: savingsPercentage,
          hasDebts: hasDebts
        }
      });

      // Отправляем на генерацию blacklist
      // Используем путь без префикса /api, так как baseURL уже содержит /api
      const response = await api.post("/ai/suggest-blacklist", {
        profileSummary: contextText
      });

      // Сохраняем сгенерированные категории
      if (response.data.categories && response.data.categories.length > 0) {
        await api.post(`/users/${userStore.userId}/blacklist`, {
          categories: response.data.categories
        });
      }

      // Обновляем профиль
      await userStore.loadProfile();
      
      // Завершаем анкету
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Ошибка при сохранении анкеты:", error);
      alert("Ошибка при сохранении данных");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              На что ты тратишь больше всего денег?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Выбери все подходящие категории (можно несколько)
            </p>
            <div className="flex flex-wrap gap-2">
              {SPENDING_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat, setTopSpending, topSpending)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    topSpending.includes(cat)
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-[#1d1f24] text-gray-200 border-[#31343a] hover:bg-[#2a2d33]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              Какие категории трат ты считаешь импульсивными?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Покупки, о которых потом жалеешь
            </p>
            <div className="flex flex-wrap gap-2">
              {SPENDING_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat, setImpulsiveCategories, impulsiveCategories)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    impulsiveCategories.includes(cat)
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-[#1d1f24] text-gray-200 border-[#31343a] hover:bg-[#2a2d33]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              Есть ли у тебя финансовые цели?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Например: "Купить машину через год", "Накопить на отпуск"
            </p>
            <textarea
              value={financialGoals}
              onChange={(e) => setFinancialGoals(e.target.value)}
              placeholder="Опиши свои финансовые цели..."
              className="w-full bg-[#1d1f24] border border-[#31343a] px-4 py-3 rounded-xl text-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              Какие траты мешают достижению целей?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Выбери категории, которые отвлекают от целей
            </p>
            <div className="flex flex-wrap gap-2">
              {SPENDING_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat, setBlockingCategories, blockingCategories)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    blockingCategories.includes(cat)
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-[#1d1f24] text-gray-200 border-[#31343a] hover:bg-[#2a2d33]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              Какой процент дохода ты хочешь откладывать?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {savingsPercentage}% от зарплаты
            </p>
            <input
              type="range"
              min="0"
              max="50"
              value={savingsPercentage}
              onChange={(e) => setSavingsPercentage(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              Есть ли у тебя кредиты или долги?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Это поможет точнее определить категории для ограничения
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setHasDebts(true)}
                className={`flex-1 px-4 py-3 rounded-xl border transition ${
                  hasDebts
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-[#1d1f24] text-gray-200 border-[#31343a] hover:bg-[#2a2d33]"
                }`}
              >
                Да
              </button>
              <button
                onClick={() => setHasDebts(false)}
                className={`flex-1 px-4 py-3 rounded-xl border transition ${
                  !hasDebts
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-[#1d1f24] text-gray-200 border-[#31343a] hover:bg-[#2a2d33]"
                }`}
              >
                Нет
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#16181d] border border-[#26292f] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-white">
              Расширенная анкета
            </h2>
            <span className="text-sm text-gray-400">
              Шаг {currentStep} из {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          {renderStep()}
        </div>

        <div className="flex justify-between gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl text-sm bg-[#1f2126] text-gray-300 hover:bg-[#2a2d33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-sm bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
            >
              Далее →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm bg-yellow-400 text-black font-semibold hover:bg-yellow-300 disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Завершить"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ExtendedProfileModal;

