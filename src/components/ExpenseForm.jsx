function ExpenseForm({ categories, formState, setFormState, onSubmit }) {
  return (
    <form className="form" onSubmit={onSubmit}>
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
  );
}

export default ExpenseForm;
