import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GoalsPage = observer(() => {
  const { userStore, goalStore } = useStores();
  const nav = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!userStore.user) {
      nav("/login");
      return;
    }
    if (userStore.userId) {
      goalStore.loadForUser(userStore.userId, showCompleted);
    }
  }, [userStore.user, userStore.userId, showCompleted]);

  const handleAddGoal = async (goalData) => {
    try {
      await goalStore.createGoal(userStore.userId, goalData);
      setShowAddModal(false);
    } catch (e) {
      alert("Ошибка при создании цели: " + e.message);
    }
  };

  const handleUpdateGoal = async (goalId, goalData) => {
    try {
      await goalStore.updateGoal(goalId, goalData);
      setEditingGoal(null);
    } catch (e) {
      alert("Ошибка при обновлении цели: " + e.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm("Удалить эту цель?")) return;
    try {
      await goalStore.deleteGoal(goalId);
    } catch (e) {
      alert("Ошибка при удалении цели: " + e.message);
    }
  };

  if (!userStore.user) return null;

  const goals = showCompleted ? goalStore.goals : goalStore.activeGoals;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Назад
        </button>
        <div className="font-semibold">Мои цели</div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-primary text-black px-3 py-1 rounded-full font-semibold hover:bg-yellow-300"
        >
          + Добавить
        </button>
      </header>

      <main className="flex-1 px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Финансовые цели</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-400">Показать выполненные</span>
          </label>
        </div>

        {goals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-4">Пока нет целей</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-yellow-300"
            >
              Добавить первую цель
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${
                  goal.isCompleted ? "opacity-60" : ""
                }`}
              >
                {editingGoal?._id === goal._id ? (
                  <GoalEditForm
                    goal={goal}
                    onSave={(data) => handleUpdateGoal(goal._id, data)}
                    onCancel={() => setEditingGoal(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{goal.title}</h3>
                          {goal.isCompleted && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              Выполнено
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-primary mb-1">
                          {goal.price.toLocaleString()} ₽
                        </div>
                        {goal.description && (
                          <p className="text-sm text-slate-400 mt-2">{goal.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded mb-2">
                          Приоритет {goal.priority}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="px-3 py-1 text-sm bg-slate-800 rounded-lg hover:bg-slate-700"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleUpdateGoal(goal._id, { isCompleted: !goal.isCompleted })}
                        className="px-3 py-1 text-sm bg-slate-800 rounded-lg hover:bg-slate-700"
                      >
                        {goal.isCompleted ? "Вернуть" : "Выполнено"}
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        Удалить
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <GoalAddModal
          onSave={handleAddGoal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
});

const GoalEditForm = ({ goal, onSave, onCancel }) => {
  const [title, setTitle] = useState(goal.title);
  const [price, setPrice] = useState(goal.price);
  const [priority, setPriority] = useState(goal.priority);
  const [description, setDescription] = useState(goal.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, price: Number(price), priority: Number(priority), description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название цели"
        required
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Сумма (₽)"
        required
        min="0"
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
      />
      <div>
        <label className="text-sm text-slate-400 mb-1 block">
          Приоритет (1 = высший, 10 = низший)
        </label>
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          min="1"
          max="10"
          required
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание (необязательно)"
        rows="3"
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-yellow-300"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

const GoalAddModal = ({ onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState(1);
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      price: Number(price),
      priority: Number(priority),
      description
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Добавить цель</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название цели *"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Сумма (₽) *"
            required
            min="0"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Приоритет (1 = высший, 10 = низший) *
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              min="1"
              max="10"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows="3"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-yellow-300"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalsPage;

