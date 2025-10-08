import { useState } from "react";

export default function BudgetSelector({ budgetMode, setBudgetMode, customBudget, setCustomBudget }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm bg-white p-3 rounded-lg shadow-sm">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="budget"
          value="default"
          checked={budgetMode === "default"}
          onChange={() => {
            setBudgetMode("default");
            setCustomBudget(100.0);
          }}
        />
        <span>💷 Default Budget (£100.0m)</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="budget"
          value="set"
          checked={budgetMode === "set"}
          onChange={() => setBudgetMode("set")}
        />
        <span>✏️ Set Budget</span>
        {budgetMode === "set" && (
          <input
            type="number"
            step="0.1"
            min="80"
            max="150"
            value={customBudget}
            onChange={(e) => setCustomBudget(parseFloat(e.target.value) || 0)}
            className="ml-2 w-20 border border-gray-300 rounded px-2 py-0.5 text-sm"
          />
        )}
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="budget"
          value="unlimited"
          checked={budgetMode === "unlimited"}
          onChange={() => {
            setBudgetMode("unlimited");
            setCustomBudget(Infinity);
          }}
        />
        <span>♾️ Unlimited Budget</span>
      </label>
    </div>
  );
}
