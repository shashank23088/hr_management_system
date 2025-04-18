import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/axios'

const Teams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user || !user.employeeId) {
        setError('User data not available')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching teams for employee ID:', user.employeeId)
        const response = await api.get(`/api/teams/employee/${user.employeeId}`)
        setTeams(Array.isArray(response.data) ? response.data : [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching teams:', err)
        setError(err.response?.data?.message || err.message || 'Failed to fetch teams')
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user])

  if (loading) return <div className="p-4">Loading teams...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (teams.length === 0) return <div className="p-4">You are not a member of any team.</div>

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <div key={team._id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{team.name}</h2>
            <p className="text-gray-600 mb-4">{team.description}</p>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Leader:</span> {team.leader?.name || 'Not assigned'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Members:</span> {team.members?.length || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Teams 