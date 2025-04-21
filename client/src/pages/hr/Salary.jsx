import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const Salary = () => {
  // State now holds the consolidated employee salary overview
  const [salaryOverview, setSalaryOverview] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the Add/Edit Salary Record Modal (still needed for actions)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSalaryRecord, setCurrentSalaryRecord] = useState(null); // Holds ID for editing/deleting
  const [formData, setFormData] = useState({ 
    employee: '', 
    amount: '', 
    date: '', 
    raise: '', 
    raiseReason: '' 
  });
  const [employees, setEmployees] = useState([]); // Still needed for Add Salary modal dropdown
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the consolidated overview
  const fetchSalaryOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/salaries');
      setSalaryOverview(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching salary overview');
      toast.error(err.response?.data?.message || 'Error fetching salary overview');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for the modal
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees for modal:', err);
      // Don't necessarily block the page load for this error
    }
  };

  useEffect(() => {
    fetchSalaryOverview();
    fetchEmployees(); // Fetch employees for the modal
  }, []);

  // --- Modal Handling for Adding/Editing Specific Salary Records --- 
  const handleAddOrEditSalary = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = isEditing ? `/api/salaries/${currentSalaryRecord}` : '/api/salaries';
    const method = isEditing ? 'put' : 'post';

    try {
      await api[method](url, formData);
      toast.success(`Salary record ${isEditing ? 'updated' : 'added'} successfully!`);
      setShowModal(false);
      fetchSalaryOverview(); // Refresh the main overview list
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} salary record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (employeeData) => {
    // If editing, we target the *latest salary record ID* if it exists
    // If no salary record exists yet for this employee, we should ADD one, not edit.
    if (employeeData.salaryRecordId) {
        setIsEditing(true);
        setCurrentSalaryRecord(employeeData.salaryRecordId); // ID of the salary record
        setFormData({
          employee: employeeData._id, // Employee ID remains the same
          amount: employeeData.currentAmount || '', // Use current amount
          date: employeeData.latestSalaryDate ? new Date(employeeData.latestSalaryDate).toISOString().split('T')[0] : '', // Use latest date
          raise: employeeData.currentRaise || '', // Use current raise
          raiseReason: employeeData.currentRaiseReason || '' // Use current reason
        });
        setShowModal(true);
    } else {
        // If no salary record ID, trigger the 'Add Salary' flow for this employee
        handleAddClick(employeeData._id); 
    }
  };

  const handleAddClick = (employeeId = '') => {
    setIsEditing(false);
    setCurrentSalaryRecord(null);
    setFormData({ 
      employee: employeeId, // Pre-fill if adding from an employee without a record
      amount: '', 
      date: new Date().toISOString().split('T')[0], // Default to today
      raise: '', 
      raiseReason: '' 
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee and all associated data (user, salary records)? This action cannot be undone.')) {
      try {
        await api.delete(`/api/employees/${employeeId}`);
        toast.success('Employee and associated data deleted successfully');
        fetchSalaryOverview();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };
  // --- End Modal Handling --- 

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Helper function to format raise display
  const formatRaise = (raise, reason) => {
    if (!raise || raise === 0) return '-'; // Show dash if no raise
    const formattedRaise = Number(raise).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return (
      <span className={raise > 0 ? 'text-green-600' : 'text-red-600'}>
        {raise > 0 ? '+' : ''}{formattedRaise}
        {reason && <span className="text-gray-500 text-xs ml-1">({reason})</span>}
      </span>
    );
  };

  // Helper function to format date
  const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <div className="text-center mt-8">Loading salary overview...</div>;
  // Keep error display as is
  if (error && !loading) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salary Management</h1>
        <button
          onClick={() => handleAddClick()} // Opens modal for adding a NEW salary record
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <FaPlus className="inline mr-2" /> Add Salary Record
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Raise</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaryOverview.map((employeeData) => ( 
              <tr key={employeeData._id}> {/* Key is now Employee ID */}
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{employeeData.name}</div>
                  <div className="text-xs text-gray-500">{employeeData.position || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  {/* Display the calculated current amount */}
                  <div className="text-sm text-gray-900">{formatCurrency(employeeData.currentAmount)}</div>
                </td>
                <td className="px-6 py-4">
                  {/* Display the latest raise info */}
                  {formatRaise(employeeData.currentRaise, employeeData.currentRaiseReason)}
                </td>
                <td className="px-6 py-4">
                  {/* Display the effective date of the latest info */}
                  <div className="text-sm text-gray-900">{formatDate(employeeData.latestSalaryDate)}</div>
                </td>
                <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                  {/* Edit action should now potentially ADD a record if none exists, or edit latest */}
                  <button onClick={() => handleEditClick(employeeData)} className="text-blue-600 hover:text-blue-900">
                    <FaEdit title="Edit/Add Latest Record" className="inline" />
                  </button>
                  {/* Always show delete button, pass Employee ID */}
                  <button onClick={() => handleDelete(employeeData._id)} className="text-red-600 hover:text-red-900">
                    <FaTrash title="Delete Employee Record" className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Specific Salary Records (UI remains largely the same) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Salary Record' : 'Add New Salary Record'}</h2>
            <form onSubmit={handleAddOrEditSalary} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  name="employee"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  required
                  disabled={isEditing} // Disable if editing, employee shouldn't change
                >
                  <option value="" disabled>Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              {/* Rest of the form fields: amount, date, raise, raiseReason */} 
              {/* ... (Amount) ... */}
              <div>
                 <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Base Amount ($)</label>
                 <input id="amount" type="number" name="amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              {/* ... (Date) ... */}
              <div>
                 <label htmlFor="date" className="block text-sm font-medium text-gray-700">Effective Date</label>
                 <input id="date" type="date" name="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              {/* ... (Raise Amount - Optional) ... */}
              <div>
                <label htmlFor="raise" className="block text-sm font-medium text-gray-700">Raise Amount ($) <span className="text-xs text-gray-500">(optional)</span></label>
                <input id="raise" type="number" name="raise" value={formData.raise} onChange={(e) => setFormData({ ...formData, raise: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., 5000" />
              </div>
              {/* ... (Raise Reason - Optional) ... */}
              <div>
                <label htmlFor="raiseReason" className="block text-sm font-medium text-gray-700">Reason for Raise <span className="text-xs text-gray-500">(optional)</span></label>
                <input id="raiseReason" type="text" name="raiseReason" value={formData.raiseReason} onChange={(e) => setFormData({ ...formData, raiseReason: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., Annual increase, Promotion" />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (isEditing ? 'Update Record' : 'Add Record')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary 