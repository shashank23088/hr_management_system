import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/axios'
import { FaUsers, FaUserTie } from 'react-icons/fa'

const Profile = () => {
  const [employee, setEmployee] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    if (!user || !user.employeeId) {
      setError('User data not available')
      setLoading(false)
      return
    }

    try {
      const [employeeResponse, teamsResponse] = await Promise.all([
        api.get(`/api/employees/${user.employeeId}`),
        api.get(`/api/teams/employee/${user.employeeId}`)
      ])
      
      setEmployee(employeeResponse.data)
      setTeams(teamsResponse.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch data')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()

    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchData, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [fetchData])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!employee) return <div className="p-4">No employee data found</div>

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <div className="space-y-6">
        {/* Personal and Employment Info */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
              <p><span className="font-medium">Name:</span> {employee.name}</p>
              <p><span className="font-medium">Email:</span> {employee.email}</p>
              <p><span className="font-medium">Position:</span> {employee.position}</p>
              <p><span className="font-medium">Department:</span> {employee.department}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Employment Details</h2>
              <p><span className="font-medium">Joining Date:</span> {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</p>
              <p>
                <span className="font-medium">Current Salary:</span> ${employee.currentSalary ? employee.currentSalary.toLocaleString() : employee.baseSalary?.toLocaleString() || 'N/A'}
                {employee.lastRaise > 0 && (
                  <span className="text-green-600 ml-2">
                    (+${employee.lastRaise.toLocaleString()}{employee.lastRaiseReason ? ` - ${employee.lastRaiseReason}` : ''})
                  </span>
                )}
              </p>
              {employee.lastSalaryUpdate && (
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(employee.lastSalaryUpdate).toLocaleDateString()}
                </p>
              )}
              <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{employee.status || 'N/A'}</span></p>
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Teams</h2>
            <span className="text-sm text-gray-600">Total Teams: {teams.length}</span>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-6">
              <FaUsers className="mx-auto text-4xl text-gray-400 mb-2" />
              <p className="text-gray-600">You are not a member of any team yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-blue-600">{team.name}</h3>
                    {team.leader?._id === user.employeeId && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Team Leader</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{team.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FaUserTie className="text-gray-500 mr-2" />
                      <span className="font-medium mr-2">Leader:</span>
                      <span>{team.leader?.name || 'Not assigned'}</span>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium mb-1">Team Members ({team.members?.length || 0})</p>
                      <div className="pl-2 space-y-1">
                        {team.members?.map((member) => (
                          <div 
                            key={member._id} 
                            className="flex items-center py-1"
                          >
                            <span className={member._id === user.employeeId ? 'text-blue-600 font-medium' : ''}>
                              {member.name}
                            </span>
                            {member._id === team.leader?._id && (
                              <span className="text-xs text-gray-500 ml-2">(Leader)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile 