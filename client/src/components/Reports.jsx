import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportsAPI } from '../api';
import { format, subMonths } from 'date-fns';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

function Reports() {
  const [summary, setSummary] = useState(null);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchReports();
  }, [period, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period,
      };

      const [summaryRes, categoryRes, trendRes, budgetRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getSpendingByCategory(params),
        reportsAPI.getIncomeVsExpense(params),
        reportsAPI.getBudgetProgress(),
      ]);

      setSummary(summaryRes.data);
      setSpendingByCategory(categoryRes.data.data || []);
      setIncomeVsExpense(trendRes.data || []);
      setBudgetProgress(budgetRes.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <p>Visualize your financial data</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="report-filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label>Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Balance</h3>
          <div className="value">{formatCurrencyFull(summary?.totalBalance || 0)}</div>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <div className="value" style={{ color: '#10b981' }}>
            {formatCurrencyFull(summary?.totalIncome || 0)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="value" style={{ color: '#ef4444' }}>
            {formatCurrencyFull(summary?.totalExpenses || 0)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Savings Rate</h3>
          <div className="value">{(summary?.savingsRate || 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* Income vs Expenses Trend */}
      <div className="chart-container">
        <h3>Income vs Expenses Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={incomeVsExpense}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrencyFull(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Spending by Category */}
        <div className="chart-container">
          <h3>Spending by Category</h3>
          {spendingByCategory.length === 0 ? (
            <div className="empty-state">
              <p>No expense data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.category_name}: ${entry.percentage.toFixed(0)}%`}
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '1rem' }}>
                {spendingByCategory.map((cat, index) => (
                  <div key={cat.category_name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        backgroundColor: COLORS[index % COLORS.length],
                      }} />
                      {cat.category_name}
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      {formatCurrencyFull(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Budget Progress */}
        <div className="chart-container">
          <h3>Budget Progress</h3>
          {budgetProgress.length === 0 ? (
            <div className="empty-state">
              <p>No budgets set</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetProgress} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="category_name" width={100} />
                <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                <Legend />
                <Bar dataKey="spent" fill="#ef4444" name="Spent" />
                <Bar dataKey="amount" fill="#10b981" name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
