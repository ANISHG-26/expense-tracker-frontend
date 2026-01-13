function RecentExpenses({
  expenses,
  status,
  total,
  categoryMap,
  formatCurrency,
  displayCurrency,
  displayFormatter,
  onDelete
}) {
  return (
    <div className="card compact-card">
      <h2>Recent expenses</h2>
      <div className="summary">
        <div>
          <div className="small">Total spend</div>
          <strong>{formatCurrency(total, displayCurrency, displayFormatter)}</strong>
        </div>
        <span className="badge">{expenses.length} entries</span>
      </div>
      <div className="card-scroll">
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
                    {formatCurrency(expense.amount, expense.currency)}
                  </strong>
                  <div className="small">
                    {categoryMap.get(expense.categoryId) || "Uncategorized"}
                    {expense.merchant ? ` - ${expense.merchant}` : ""}
                    {expense.note ? ` - ${expense.note}` : ""}
                  </div>
                  <div className="small">{expense.date}</div>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={() => onDelete(expense.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentExpenses;
