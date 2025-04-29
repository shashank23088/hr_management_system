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
  const fetchSalaryOverview = async (showErrors = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/salaries');
      if (response.data) {
        setSalaryOverview(response.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching salary overview:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error fetching salary overview';
      setError(errorMessage);
      // Only show toast if showErrors is true
      if (showErrors) {
        toast.error(errorMessage);
      }
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
    fetchSalaryOverview(true); // Show errors on initial load
    fetchEmployees(); // Fetch employees for the modal
  }, []);

  // --- Modal Handling for Adding/Editing Specific Salary Records --- 
  const handleAddOrEditSalary = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && !currentSalaryRecord) {
        throw new Error('Invalid salary record ID');
      }

      // Validate numeric fields
      const amount = parseFloat(formData.amount);
      const raise = formData.raise ? parseFloat(formData.raise) : 0;

      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount value');
      }

      if (isNaN(raise) || raise < 0) {
        throw new Error('Invalid raise value');
      }

      // Process form data
      const processedFormData = {
        ...formData,
        amount,
        raise,
        date: new Date(formData.date).toISOString()
      };

      // Log the request data for debugging
      console.log('Sending salary update request:', {
        url: isEditing ? `/api/salaries/${currentSalaryRecord}` : '/api/salaries',
        method: isEditing ? 'put' : 'post',
        data: processedFormData
      });

      const response = await api[isEditing ? 'put' : 'post'](
        isEditing ? `/api/salaries/${currentSalaryRecord}` : '/api/salaries',
        processedFormData
      );
      
      if (response.data) {
        toast.success(`Salary record ${isEditing ? 'updated' : 'added'} successfully!`);
        
        // Reset form and modal state
        setShowModal(false);
        setFormData({ 
          employee: '', 
          amount: '', 
          date: new Date().toISOString().split('T')[0], 
          raise: '', 
          raiseReason: '' 
        });
        setCurrentSalaryRecord(null);
        setIsEditing(false);
        
        // Fetch fresh data to ensure we have the latest state
        await fetchSalaryOverview(false);
      }
    } catch (err) {
      console.error('Salary update error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      let errorMessage;
      if (err.response?.data?.details) {
        errorMessage = err.response.data.details;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = `Failed to ${isEditing ? 'update' : 'add'} salary record`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (employeeData) => {
    if (employeeData.salaryRecordId) {
      setIsEditing(true);
      
      // Clean and validate the salary ID
      const salaryId = employeeData.salaryRecordId.toString().trim();
      console.log('Editing salary record:', {
        rawId: employeeData.salaryRecordId,
        cleanedId: salaryId,
        employeeData
      });
      
      setCurrentSalaryRecord(salaryId);
      
      // Format numeric values
      const formattedAmount = employeeData.currentAmount ? 
        parseFloat(employeeData.currentAmount).toString() : '';
      const formattedRaise = employeeData.currentRaise ? 
        parseFloat(employeeData.currentRaise).toString() : '';
      
      setFormData({
        employee: employeeData._id,
        amount: formattedAmount,
        date: employeeData.latestSalaryDate ? 
          new Date(employeeData.latestSalaryDate).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        raise: formattedRaise,
        raiseReason: employeeData.currentRaiseReason || ''
      });
      setShowModal(true);
    } else {
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
              <tr key={employeeData._id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{employeeData.name}</div>
                  <div className="text-xs text-gray-500">{employeeData.position || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{formatCurrency(employeeData.currentAmount)}</div>
                </td>
                <td className="px-6 py-4">
                  {formatRaise(employeeData.currentRaise, employeeData.currentRaiseReason)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{formatDate(employeeData.latestSalaryDate)}</div>
                </td>
                <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                  <button onClick={() => handleEditClick(employeeData)} className="text-blue-600 hover:text-blue-900">
                    <FaEdit title="Edit/Add Latest Record" className="inline" />
                  </button>
                  <button onClick={() => handleDelete(employeeData._id)} className="text-red-600 hover:text-red-900">
                    <FaTrash title="Delete Employee Record" className="inline" />
                  </button>
                </td>
              </tr>))}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  required
                  disabled={isEditing}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Base Amount ($)</label>
                <input 
                  id="amount" 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                  required 
                  min="0" 
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Effective Date</label>
                <input 
                  id="date" 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="raise" className="block text-sm font-medium text-gray-700">
                  Raise Amount ($) <span className="text-xs text-gray-500">(optional)</span>
                </label>
                <input 
                  id="raise" 
                  type="number" 
                  name="raise" 
                  value={formData.raise} 
                  onChange={(e) => setFormData({ ...formData, raise: e.target.value })} 
                  min="0" 
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="raiseReason" className="block text-sm font-medium text-gray-700">
                  Reason for Raise <span className="text-xs text-gray-500">(optional)</span>
                </label>
                <input 
                  id="raiseReason" 
                  type="text" 
                  name="raiseReason" 
                  value={formData.raiseReason} 
                  onChange={(e) => setFormData({ ...formData, raiseReason: e.target.value })} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary 