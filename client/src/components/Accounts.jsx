import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { accountsAPI } from '../api';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '0',
    currency: 'USD',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      alert('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAccount) {
        await accountsAPI.update(editingAccount.id, formData);
      } else {
        await accountsAPI.create(formData);
      }

      setShowModal(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Failed to save account');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this account? All associated transactions will remain but will be orphaned.')) return;

    try {
      await accountsAPI.delete(id);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'bank',
      balance: '0',
      currency: 'USD',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  };

  const getAccountTypeIcon = (type) => {
    const icons = {
      bank: '🏦',
      cash: '💵',
      credit: '💳',
      savings: '🏦',
      investment: '📈',
    };
    return icons[type] || '💰';
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Accounts</h2>
        <p>Manage your financial accounts</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          TOTAL BALANCE
        </h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#111827' }}>
          {formatCurrency(getTotalBalance())}
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="card empty-state">
          <p>No accounts yet. Create your first account to get started!</p>
        </div>
      ) : (
        <div className="accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {accounts.map((account) => (
            <div key={account.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {getAccountTypeIcon(account.type)}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {account.name}
                  </h3>
                  <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                    {account.type}
                  </span>
                </div>
                <div className="actions">
                  <button className="icon-btn" onClick={() => handleEdit(account)}>
                    <Edit2 size={18} />
                  </button>
                  <button className="icon-btn" onClick={() => handleDelete(account.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Current Balance
                </div>
                <div style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: account.balance >= 0 ? '#10b981' : '#ef4444',
                }}>
                  {formatCurrency(account.balance)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit Card</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;
