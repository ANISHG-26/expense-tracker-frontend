function InsightsCard({
  groupBy,
  setGroupBy,
  reportRange,
  setReportRange,
  groupedExpenses,
  maxBucketTotal,
  isRangeValid,
  reportStatus,
  onDownload,
  formatCurrency,
  displayCurrency,
  displayFormatter
}) {
  return (
    <div className="card compact-card">
      <h2>Spending insights</h2>
      <div className="card-scroll">
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
          ) : groupBy === "week" ? (
            <div className="bar-chart">
              {groupedExpenses.map((bucket) => {
                const height = maxBucketTotal
                  ? Math.round((bucket.total / maxBucketTotal) * 100)
                  : 0;
                return (
                  <div className="bar-item" key={bucket.key}>
                    <div className="bar-track">
                      <span style={{ height: `${height}%` }} />
                    </div>
                    <div className="bar-meta">
                      <span className="bar-label">{bucket.label}</span>
                      <strong>
                        {formatCurrency(
                          bucket.total,
                          displayCurrency,
                          displayFormatter
                        )}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="chart-rows">
              {groupedExpenses.map((bucket) => (
                <div className="chart-row" key={bucket.key}>
                  <div>
                    <div className="small">{bucket.label}</div>
                    <strong>
                      {formatCurrency(
                        bucket.total,
                        displayCurrency,
                        displayFormatter
                      )}
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
              ))}
            </div>
          )}
        </div>

        <div className="report-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onDownload}
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
    </div>
  );
}

export default InsightsCard;
