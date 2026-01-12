import { useEffect, useMemo, useState } from "react";
import {
  createExpense,
  deleteExpense,
  fetchCategories,
  fetchExpenses
} from "./api";

const defaultForm = {
  amount: "",
  currency: "USD",
  categoryId: "",
  merchant: "",
  note: "",
  date: new Date().toISOString().slice(0, 10)
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formState, setFormState] = useState(defaultForm);
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    async function loadData() {
      try {
        const [expensesData, categoriesData] = await Promise.all([
          fetchExpenses(),
          fetchCategories()
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
        if (categoriesData.length) {
          setFormState((prev) => ({
            ...prev,
            categoryId: prev.categoryId || categoriesData[0].id
          }));
        }
      } catch (error) {
        setStatus({ loading: false, error: error.message });
        return;
      }
      setStatus({ loading: false, error: "" });
    }

    loadData();
  }, []);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, error: "" }));

    try {
      const payload = {
        amount: Number(formState.amount),
        currency: formState.currency,
        categoryId: formState.categoryId,
        merchant: formState.merchant || undefined,
        note: formState.note || undefined,
        date: formState.date
      };
      const created = await createExpense(payload);
      setExpenses((prev) => [created, ...prev]);
      setFormState((prev) => ({
        ...defaultForm,
        categoryId: prev.categoryId,
        currency: prev.currency
      }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: error.message }));
    }
  }

  async function handleDelete(id) {
    setStatus((prev) => ({ ...prev, error: "" }));
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: error.message }));
    }
  }

  return (
    <div className="app">
      <section className="hero">
        <span className="badge">POC</span>
        <h1>Expense Tracker</h1>
        <p>
          Track daily spending with a contract-driven API. Update the OpenAPI
          spec and watch the UI evolve with it.
        </p>
      </section>

      {status.error ? <div className="error">{status.error}</div> : null}

      <section className="grid">
        <div className="card">
          <h2>Add expense</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    amount: event.target.value
                  }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="currency">Currency</label>
              <input
                id="currency"
                value={formState.currency}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    currency: event.target.value.toUpperCase()
                  }))
                }
                maxLength={3}
                required
              />
            </div>
            <div>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={formState.categoryId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    categoryId: event.target.value
                  }))
                }
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="merchant">Merchant</label>
              <input
                id="merchant"
                value={formState.merchant}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    merchant: event.target.value
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <label htmlFor="note">Note</label>
              <input
                id="note"
                value={formState.note}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    note: event.target.value
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    date: event.target.value
                  }))
                }
                required
              />
            </div>
            <button className="button" type="submit">
              Add expense
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Recent expenses</h2>
          <div className="summary">
            <div>
              <div className="small">Total spend</div>
              <strong>
                {formState.currency} {total.toFixed(2)}
              </strong>
            </div>
            <span className="badge">{expenses.length} entries</span>
          </div>
          <div className="list" style={{ marginTop: "16px" }}>
            {status.loading ? (
              <div className="small">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="small">No expenses yet.</div>
            ) : (
              expenses.map((expense) => (
                <div className="list-item" key={expense.id}>
                  <div>
                    <strong>
                      {expense.currency} {Number(expense.amount).toFixed(2)}
                    </strong>
                    <div className="small">
                      {categoryMap.get(expense.categoryId) || "Uncategorized"}
                      {expense.merchant ? ` • ${expense.merchant}` : ""}
                      {expense.note ? ` • ${expense.note}` : ""}
                    </div>
                    <div className="small">{expense.date}</div>
                  </div>
                  <button
                    className="button"
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
