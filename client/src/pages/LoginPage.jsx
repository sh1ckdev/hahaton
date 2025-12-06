import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const LoginPage = observer(() => {
  const { userStore } = useStores();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;

    userStore.setCredentials(phone, nickname);
    await userStore.loginOrRegister();
    nav("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 rounded-full bg-primary items-center justify-center text-black font-bold">
            T
          </span>
          Рациональный ассистент
        </h1>
        <p className="text-slate-400 mb-6">
          Введи номер телефона и никнейм. Если тебя ещё нет — создадим профиль.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">
              Номер телефона / ID
            </label>
            <input
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-slate-50"
              placeholder="+7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-300">
              Никнейм
            </label>
            <input
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-slate-50"
              placeholder="Alex"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={userStore.loading}
            className="w-full py-2 rounded-xl bg-primary text-black font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            {userStore.loading ? "Загрузка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
});

export default LoginPage;
