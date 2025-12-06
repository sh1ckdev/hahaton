import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";
import api from "../api/client";

const CATEGORIES = [
  "игры",
  "техника",
  "одежда",
  "развлечения",
  "путешествия",
  "еда",
  "транспорт",
  "другое"
];

const AddPurchaseModal = observer(({ onClose }) => {
  const { userStore, purchaseStore } = useStores();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [ai, setAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [advice, setAdvice] = useState("");
  const [createdPurchase, setCreatedPurchase] = useState(null);

  const submit = async () => {
    if (!title || !price) {
      alert("Заполните название и цену");
      return;
    }

    setLoading(true);
    try {
      // Создаем покупку
      const response = await api.post(`/purchases/${userStore.userId}`, {
        title,
        price: Number(price),
        category: category || undefined,
        url: url || undefined,
        useAiCategory: ai && !category
      });

      const purchase = response.data;
      setCreatedPurchase(purchase);

      // Если покупка не заблокирована, получаем совет ассистента
      if (purchase.status === "planned" && !purchase.blockedByCategory) {
        try {
          const adviceResponse = await api.get(`/ai/purchase-advice/${purchase._id}`);
          setAdvice(adviceResponse.data.advice || "Покупка добавлена в список запланированных.");
          setShowAdvice(true);
        } catch (e) {
          console.error("Error getting advice:", e);
          // Показываем модалку даже без совета
          setAdvice("Покупка добавлена. Хотите добавить её в вишлист?");
          setShowAdvice(true);
        }
      } else if (purchase.blockedByCategory) {
        // Если заблокирована - показываем сообщение
        setAdvice(`Эта покупка заблокирована, так как категория "${purchase.category}" находится в вашем blacklist.`);
        setShowAdvice(true);
      } else {
        // Если сразу куплена или отменена
        await purchaseStore.loadForUser(userStore.userId);
        onClose();
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      alert("Ошибка при добавлении покупки");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!createdPurchase) return;
    
    // Покупка уже создана как planned, просто закрываем модалку
    await purchaseStore.loadForUser(userStore.userId);
    setShowAdvice(false);
    onClose();
  };

  const handleConfirmPurchase = async () => {
    if (!createdPurchase) return;
    
    // Отмечаем как купленную
    await api.post(`/purchases/bought/${createdPurchase._id}`);
    await purchaseStore.loadForUser(userStore.userId);
    setShowAdvice(false);
    onClose();
  };

  const handleCancel = async () => {
    if (!createdPurchase) return;
    
    // Отменяем покупку
    await api.post(`/purchases/cancel/${createdPurchase._id}`);
    await purchaseStore.loadForUser(userStore.userId);
    setShowAdvice(false);
    onClose();
  };

  // Показываем модалку с советом ассистента
  if (showAdvice && createdPurchase) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-96 max-w-[90vw] space-y-4">
          <h2 className="font-semibold text-lg">Совет ассистента</h2>
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{advice}</p>
          </div>

          {createdPurchase.blockedByCategory ? (
            <div className="flex gap-2">
              <button 
                onClick={handleCancel}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600"
              >
                Понятно
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleAddToWishlist}
                className="flex-1 bg-primary text-black py-2 rounded-xl font-semibold hover:bg-yellow-300"
              >
                Добавить в вишлист
              </button>
              <button 
                onClick={handleConfirmPurchase}
                className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold hover:bg-green-600"
              >
                Всё равно купить
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 bg-slate-700 text-white py-2 rounded-xl font-semibold hover:bg-slate-600"
              >
                Отменить
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-80 space-y-3">
        <h2 className="font-semibold text-lg">Новая покупка</h2>
        <input 
          className="bg-slate-800 border border-slate-700 w-full px-3 py-2 rounded-xl text-white" 
          placeholder="Название товара" 
          value={title} 
          onChange={e=>setTitle(e.target.value)}
        />
        <input 
          className="bg-slate-800 border border-slate-700 w-full px-3 py-2 rounded-xl text-white" 
          type="number" 
          placeholder="Цена (₽)" 
          value={price} 
          onChange={e=>setPrice(e.target.value)}
        />
        <input 
          className="bg-slate-800 border border-slate-700 w-full px-3 py-2 rounded-xl text-white" 
          type="url" 
          placeholder="Ссылка на товар (опционально)" 
          value={url} 
          onChange={e=>setUrl(e.target.value)}
        />
        <select
          className="bg-slate-800 border border-slate-700 w-full px-3 py-2 rounded-xl text-white"
          value={category}
          onChange={e=>setCategory(e.target.value)}
        >
          <option value="">Выберите категорию (опционально)</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label className="flex gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/> 
          Использовать AI для категории (если не выбрана)
        </label>
        <button 
          onClick={submit} 
          disabled={loading}
          className="w-full bg-primary text-black py-2 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Добавление..." : "Добавить"}
        </button>
        <button onClick={onClose} className="w-full text-slate-400 text-sm">Отмена</button>
      </div>
    </div>
  );
});

export default AddPurchaseModal;
