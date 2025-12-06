import { observer } from "mobx-react-lite";
import { useStores } from "../stores/StoreProvider.jsx";

const GoalsCarousel = observer(() => {
  const { goalStore } = useStores();
  const goals = goalStore.activeGoals;

  if (!goals.length)
    return (
      <div className="text-sm text-slate-500">
        Пока нет целей. Добавь их в разделе "Управлять целями".
      </div>
    );

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {goals.map((g) => {
        return (
          <div
            key={g._id}
            className="min-w-[220px] bg-slate-900 border border-slate-800 rounded-2xl p-3 flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold">{g.title}</div>
              <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                Приоритет {g.priority}
              </div>
            </div>
            <div className="text-sm text-slate-300 mb-2">
              {g.price.toLocaleString()} ₽
            </div>
            {g.description && (
              <div className="text-xs text-slate-400 mb-2">
                {g.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default GoalsCarousel;
