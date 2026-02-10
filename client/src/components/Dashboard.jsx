import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { accountsAPI, transactionsAPI, reportsAPI } from '../api';
import { format } from 'date-fns';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes] = await Promise.all([
        reportsAPI.getSummary(),
        transactionsAPI.getAll({ limit: 5 }),
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
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
        <h2>Dashboard</h2>
        <p>Overview of your financial status</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Balance</h3>
            <Wallet size={24} color="#4f46e5" />
          </div>
          <div className="value">{formatCurrency(summary?.totalBalance || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Income</h3>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div className="value" style={{ color: '#10b981' }}>
            {formatCurrency(summary?.totalIncome || 0)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Expenses</h3>
            <TrendingDown size={24} color="#ef4444" />
          </div>
          <div className="value" style={{ color: '#ef4444' }}>
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Net Income</h3>
            <PiggyBank size={24} color="#8b5cf6" />
          </div>
          <div className="value" style={{ color: summary?.netIncome >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(summary?.netIncome || 0)}
          </div>
          {summary?.savingsRate !== undefined && (
            <div className="change">
              Savings Rate: {summary.savingsRate.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Recent Transactions
        </h3>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.category_name}</td>
                    <td>{transaction.account_name}</td>
                    <td style={{
                      color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
