import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'
import { FaUsers, FaUserTie } from 'react-icons/fa'
import { toast } from 'react-toastify'

const Teams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchTeams = async () => {
      console.log('Current user data:', user)
      
      if (!user || !user.employeeId) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching teams for employee ID:', user.employeeId)
        const response = await api.get(`/api/teams/employee/${user.employeeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        console.log('API Response:', response.data)
        
        if (!response.data) {
          throw new Error('No data received from server')
        }
        
        // Log each team found
        if (Array.isArray(response.data)) {
          response.data.forEach(team => {
            console.log('Found team:', {
              name: team.name,
              leader: team.leader?.name,
              memberCount: team.members?.length
            })
          })
        }
        
        setTeams(Array.isArray(response.data) ? response.data : [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching teams:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch teams'
        setError(errorMessage)
        toast.error(errorMessage)
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user])

  console.log('Component state:', { loading, error, teamsCount: teams.length })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium text-center">{error}</div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-gray-600 text-center">
          <FaUsers className="mx-auto text-4xl mb-2 text-gray-400" />
          <p>You are not a member of any team yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Teams</h1>
        <div className="text-sm text-gray-600">
          Total Teams: {teams.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white mb-1">{team.name}</h2>
              <p className="text-blue-100 text-sm">{team.description}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <FaUserTie className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Team Leader</p>
                  <p className="text-sm text-gray-600">{team.leader?.name || 'Not assigned'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Team Members ({team.members?.length || 0})
                </p>
                {team.members && team.members.length > 0 ? (
                  <div className="space-y-1">
                    {team.members.map((member) => (
                      <div 
                        key={member._id} 
                        className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-50"
                      >
                        <span className="text-gray-600">{member.name}</span>
                        {member._id === team.leader?._id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Leader</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No members</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Teams 