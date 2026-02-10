import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { budgetsAPI, transactionsAPI } from '../api';
import { format } from 'date-fns';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, categoriesRes] = await Promise.all([
        budgetsAPI.getAll(),
        transactionsAPI.getCategories('expense'),
      ]);

      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBudget) {
        await budgetsAPI.update(editingBudget.id, formData);
      } else {
        await budgetsAPI.create(formData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount,
      period: budget.period,
      start_date: format(new Date(budget.start_date), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      category_id: '',
      amount: '',
      period: 'monthly',
      start_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressColor = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getProgressWidth = (spent, budget) => {
    return Math.min((spent / budget) * 100, 100);
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Budgets</h2>
        <p>Set and track spending limits</p>
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
          Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="card empty-state">
          <p>No budgets yet. Create a budget to track your spending!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {budgets.map((budget) => (
            <div key={budget.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {budget.category_name}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {budget.period} Budget • Started {format(new Date(budget.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="actions">
                  <button className="icon-btn" onClick={() => handleEdit(budget)}>
                    <Edit2 size={18} />
                  </button>
                  <button className="icon-btn" onClick={() => handleDelete(budget.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    {formatCurrency(budget.spent || 0)}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    of {formatCurrency(budget.amount)}
                  </span>
                </div>

                <div style={{
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${getProgressWidth(budget.spent, budget.amount)}%`,
                    backgroundColor: getProgressColor(budget.spent, budget.amount),
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6b7280' }}>
                  {formatCurrency(Math.max(budget.amount - budget.spent, 0))} remaining
                </span>
                <span style={{
                  fontWeight: '600',
                  color: getProgressColor(budget.spent, budget.amount),
                }}>
                  {((budget.spent / budget.amount) * 100).toFixed(0)}% used
                </span>
              </div>

              {budget.spent > budget.amount && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                }}>
                  ⚠️ Over budget by {formatCurrency(budget.spent - budget.amount)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
