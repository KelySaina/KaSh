import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { transactionsAPI, accountsAPI } from '../api';
import { format } from 'date-fns';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category_id: '',
    account_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        transactionsAPI.getAll(params),
        accountsAPI.getAll(),
        transactionsAPI.getCategories(),
      ]);

      setTransactions(transactionsRes.data?.transactions || []);
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to load transactions: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, formData);
      } else {
        await transactionsAPI.create(formData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: Math.abs(transaction.amount),
      description: transaction.description,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category_id: '',
      account_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
        <p>Track your income and expenses</p>
      </div>

      <div className="transaction-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
          <button
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`btn ${filterType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('income')}
          >
            Income
          </button>
          <button
            className={`btn ${filterType === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('expense')}
          >
            Expenses
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Add Transaction
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="card empty-state">
          <p>No transactions found</p>
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
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.category_name}</td>
                  <td>{transaction.account_name}</td>
                  <td>
                    <span className={`badge badge-${transaction.type}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td style={{
                    color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                    fontWeight: '600',
                  }}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => handleEdit(transaction)}>
                        <Edit2 size={18} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
