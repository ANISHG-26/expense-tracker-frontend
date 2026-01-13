import { useEffect, useMemo, useState } from "react";
import {
  createExpense,
  deleteExpense,
  downloadExpenseReportPdf,
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

const pad2 = (value) => String(value).padStart(2, "0");
const formatDate = (date) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;
const parseDate = (value) => new Date(`${value}T00:00:00Z`);
const getWeekStart = (date) => {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + diff);
  return start;
};
const getMonthStart = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formState, setFormState] = useState(defaultForm);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [groupBy, setGroupBy] = useState("week");
  const [reportStatus, setReportStatus] = useState({
    loading: false,
    error: ""
  });
  const [reportRange, setReportRange] = useState(() => {
    const today = new Date();
    const to = formatDate(today);
    const fromDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30)
    );
    return { from: formatDate(fromDate), to };
  });

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

  const reportExpenses = useMemo(() => {
    if (!reportRange.from || !reportRange.to) {
      return expenses;
    }
    const fromDate = parseDate(reportRange.from);
    const toDate = parseDate(reportRange.to);
    return expenses.filter((expense) => {
      if (!expense.date) {
        return false;
      }
      const expenseDate = parseDate(expense.date);
      return expenseDate >= fromDate && expenseDate <= toDate;
    });
  }, [expenses, reportRange]);

  const groupedExpenses = useMemo(() => {
    const buckets = new Map();
    reportExpenses.forEach((expense) => {
      const expenseDate = parseDate(expense.date);
      let bucketDate = expenseDate;
      let label = "";
      if (groupBy === "month") {
        bucketDate = getMonthStart(expenseDate);
        label = `${bucketDate.getUTCFullYear()}-${pad2(
          bucketDate.getUTCMonth() + 1
        )}`;
      } else {
        bucketDate = getWeekStart(expenseDate);
        label = `Week of ${formatDate(bucketDate)}`;
      }
      const key = bucketDate.toISOString();
      const current = buckets.get(key) || {
        key,
        label,
        total: 0,
        date: bucketDate
      };
      current.total += Number(expense.amount || 0);
      buckets.set(key, current);
    });
    return Array.from(buckets.values()).sort((a, b) => a.date - b.date);
  }, [groupBy, reportExpenses]);

  const maxBucketTotal = useMemo(
    () =>
      groupedExpenses.reduce(
        (maxValue, bucket) => Math.max(maxValue, bucket.total),
        0
      ),
    [groupedExpenses]
  );

  const isRangeValid = useMemo(() => {
    if (!reportRange.from || !reportRange.to) {
      return false;
    }
    return parseDate(reportRange.from) <= parseDate(reportRange.to);
  }, [reportRange]);

  const displayCurrency = useMemo(
    () => expenses[0]?.currency || formState.currency,
    [expenses, formState.currency]
  );

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

  async function handleDownloadReport() {
    if (!isRangeValid || reportStatus.loading) {
      return;
    }
    setReportStatus({ loading: true, error: "" });
    try {
      const blob = await downloadExpenseReportPdf({
        from: reportRange.from,
        to: reportRange.to,
        groupBy
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-report-${reportRange.from}-to-${reportRange.to}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setReportStatus({ loading: false, error: "" });
    } catch (error) {
      setReportStatus({ loading: false, error: error.message });
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
          <h2>Spending insights</h2>
          <div className="controls">
            <div>
              <label htmlFor="report-from">From</label>
              <input
                id="report-from"
                type="date"
                value={reportRange.from}
                onChange={(event) =>
                  setReportRange((prev) => ({
                    ...prev,
                    from: event.target.value
                  }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="report-to">To</label>
              <input
                id="report-to"
                type="date"
                value={reportRange.to}
                onChange={(event) =>
                  setReportRange((prev) => ({
                    ...prev,
                    to: event.target.value
                  }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="group-by">Group by</label>
              <select
                id="group-by"
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value)}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>

          <div className="chart">
            {groupedExpenses.length === 0 ? (
              <div className="small">No expenses in this range.</div>
            ) : (
              groupedExpenses.map((bucket) => (
                <div className="chart-row" key={bucket.key}>
                  <div>
                    <div className="small">{bucket.label}</div>
                    <strong>
                      {displayCurrency} {bucket.total.toFixed(2)}
                    </strong>
                  </div>
                  <div className="chart-bar">
                    <span
                      style={{
                        width: `${
                          maxBucketTotal
                            ? Math.round((bucket.total / maxBucketTotal) * 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="report-actions">
            <button
              className="button secondary"
              type="button"
              onClick={handleDownloadReport}
              disabled={!isRangeValid || reportStatus.loading}
            >
              {reportStatus.loading ? "Preparing PDF..." : "Download PDF report"}
            </button>
            {!isRangeValid ? (
              <div className="small">Choose a valid date range.</div>
            ) : null}
            {reportStatus.error ? (
              <div className="small error-inline">{reportStatus.error}</div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <h2>Recent expenses</h2>
          <div className="summary">
            <div>
              <div className="small">Total spend</div>
              <strong>
                {displayCurrency} {total.toFixed(2)}
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
