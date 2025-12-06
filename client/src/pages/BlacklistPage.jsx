import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ALL_CATEGORIES = [
  "игры",
  "техника",
  "одежда",
  "развлечения",
  "путешествия",
  "прочее"
];

const BlacklistPage = observer(() => {
  const { userStore } = useStores();
  const nav = useNavigate();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const existing =
      userStore.user?.notificationSettings?.excludeCategories || [];
    setSelected(existing);
  }, [userStore.user]);

  const toggle = (cat) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const save = async () => {
    await userStore.updateBlacklist(selected);
    nav("/");
  };

  if (!userStore.user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Назад
        </button>
        <div className="font-semibold">Blacklist категорий</div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-4 py-4">
        <p className="text-sm text-slate-400 mb-4">
          Здесь ты задаёшь категории, на которые ассистент будет жёстко смотреть.
          Покупки из этих категорий он будет блокировать или сильно отговаривать.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_CATEGORIES.map((cat) => {
            const active = selected.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  active
                    ? "bg-primary text-black border-primary"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <button
          onClick={save}
          className="px-4 py-2 rounded-xl bg-primary text-black font-semibold hover:bg-primary-dark"
        >
          Сохранить
        </button>
      </main>
    </div>
  );
});

export default BlacklistPage;
