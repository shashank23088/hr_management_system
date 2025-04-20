import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../../redux/slices/teamSlice';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { FaTrash, FaUsers, FaEdit } from 'react-icons/fa';

const Teams = () => {
  const dispatch = useDispatch();
  const { records: teams, loading, error } = useSelector((state) => state.teams);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
    members: []
  });

  useEffect(() => {
    dispatch(fetchTeams());
    fetchEmployees();
  }, [dispatch]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      toast.error('Failed to fetch employees');
    }
  };

  const handleEditClick = (team) => {
    setTeamToEdit(team);
    setFormData({
      name: team.name,
      description: team.description,
      leader: team.leader?._id || '',
      members: team.members?.map(member => member._id) || []
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e, localFormData) => {
    e.preventDefault();
    if (!localFormData.leader) {
      toast.error('Please select a team leader');
      return;
    }
    try {
      await dispatch(updateTeam({ id: teamToEdit._id, teamData: localFormData })).unwrap();
      toast.success('Team updated successfully');
      setShowEditModal(false);
      setTeamToEdit(null);
      setFormData({ name: '', description: '', leader: '', members: [] });
    } catch (err) {
      toast.error(err.message || 'Failed to update team');
    }
  };

  const handleSubmit = async (e, localFormData) => {
    e.preventDefault();
    if (!localFormData.leader) {
      toast.error('Please select a team leader');
      return;
    }
    try {
      await dispatch(createTeam(localFormData)).unwrap();
      toast.success('Team created successfully');
      setShowModal(false);
      setFormData({ name: '', description: '', leader: '', members: [] });
    } catch (err) {
      toast.error(err.message || 'Failed to create team');
    }
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteTeam(teamToDelete._id)).unwrap();
      toast.success('Team deleted successfully');
      setShowDeleteModal(false);
      setTeamToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      const selectedValues = Array.from(selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const TeamForm = ({ onSubmit, title, submitText }) => {
    const [localFormData, setLocalFormData] = useState({
      name: '',
      description: '',
      leader: '',
      members: []
    });

    useEffect(() => {
      setLocalFormData(formData);
    }, []);

    const handleLocalChange = (e) => {
      const { name, value, type, selectedOptions } = e.target;
      if (type === 'select-multiple') {
        const selectedValues = Array.from(selectedOptions, option => option.value);
        setLocalFormData(prev => ({ ...prev, [name]: selectedValues }));
      } else {
        setLocalFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    const handleLocalSubmit = (e) => {
      e.preventDefault();
      onSubmit(e, localFormData);
    };

    return (
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <input
            type="text"
            name="name"
            value={localFormData.name}
            onChange={handleLocalChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={localFormData.description}
            onChange={handleLocalChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Team Leader
          </label>
          <select
            name="leader"
            value={localFormData.leader}
            onChange={handleLocalChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select Team Leader</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Team Members
          </label>
          <select
            name="members"
            multiple
            value={localFormData.members}
            onChange={handleLocalChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple members</p>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              if (showModal) setShowModal(false);
              if (showEditModal) {
                setShowEditModal(false);
                setTeamToEdit(null);
              }
              setFormData({ name: '', description: '', leader: '', members: [] });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {submitText}
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Team
        </button>
      </div>

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative group"
          >
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditClick(team)}
                className="text-gray-400 hover:text-blue-500"
                title="Edit Team"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDeleteClick(team)}
                className="text-gray-400 hover:text-red-500"
                title="Delete Team"
              >
                <FaTrash />
              </button>
            </div>
            <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
            <p className="text-gray-600 mb-4">{team.description}</p>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">Team Leader</h4>
              <p className="text-gray-800">{team.leader?.name || 'Not assigned'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Members ({team.members?.length || 0})
              </h4>
              <div className="space-y-1">
                {team.members?.map((member) => (
                  <p key={member._id} className="text-gray-800 flex items-center">
                    <FaUsers className="mr-2 text-gray-400" />
                    {member.name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Team</h2>
            <TeamForm 
              onSubmit={handleSubmit} 
              submitText="Create" 
            />
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && teamToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Team: {teamToEdit.name}</h2>
            <TeamForm 
              onSubmit={handleEditSubmit} 
              submitText="Update" 
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && teamToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Delete Team</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the team "{teamToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTeamToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams; 