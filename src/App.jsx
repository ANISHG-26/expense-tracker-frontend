import { useEffect, useMemo, useState } from "react";
import {
  createExpense,
  deleteExpense,
  downloadExpenseReportPdf,
  fetchCategories,
  fetchExpenses
} from "./api";
import ExpenseForm from "./components/ExpenseForm";
import InsightsCard from "./components/InsightsCard";
import RecentExpenses from "./components/RecentExpenses";
import {
  createCurrencyFormatter,
  formatCurrency,
  formatDate,
  getMonthStart,
  getWeekStart,
  parseDate
} from "./utils/formatters";

const defaultForm = {
  amount: "",
  currency: "CAD",
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
        label = formatDate(bucketDate).slice(0, 7);
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

  const displayFormatter = useMemo(
    () => createCurrencyFormatter(displayCurrency),
    [displayCurrency]
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
        <div className="card add-card">
          <h2>Add expense</h2>
          <ExpenseForm
            categories={categories}
            formState={formState}
            setFormState={setFormState}
            onSubmit={handleSubmit}
          />
        </div>

        <InsightsCard
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          reportRange={reportRange}
          setReportRange={setReportRange}
          groupedExpenses={groupedExpenses}
          maxBucketTotal={maxBucketTotal}
          isRangeValid={isRangeValid}
          reportStatus={reportStatus}
          onDownload={handleDownloadReport}
          formatCurrency={formatCurrency}
          displayCurrency={displayCurrency}
          displayFormatter={displayFormatter}
        />

        <RecentExpenses
          expenses={expenses}
          status={status}
          total={total}
          categoryMap={categoryMap}
          formatCurrency={formatCurrency}
          displayCurrency={displayCurrency}
          displayFormatter={displayFormatter}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}

export default App;
