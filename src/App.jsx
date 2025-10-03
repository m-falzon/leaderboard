import { useState, useEffect } from 'react'
import Leaderboard from './components/Leaderboard'
import RecordMatch from './components/RecordMatch'
import MatchHistory from './components/MatchHistory'
import AddGame from './components/AddGame'
import Challenges from './components/Challenges'
import CreateChallenge from './components/CreateChallenge'
import ManageUsers from './components/ManageUsers'

function App() {
  const [users, setUsers] = useState([])
  const [matches, setMatches] = useState([])
  const [challenges, setChallenges] = useState([])
  const [games, setGames] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, matchesRes, challengesRes, gamesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/matches'),
        fetch('/api/challenges'),
        fetch('/api/games')
      ])
      
      const usersData = await usersRes.json()
      const matchesData = await matchesRes.json()
      const challengesData = await challengesRes.json()
      const gamesData = await gamesRes.json()
      
      setUsers(usersData)
      setMatches(matchesData)
      setChallenges(challengesData)
      setGames(gamesData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleUserUpdate = async () => {
    await fetchData() // Refresh all data
  }

  const handleMatchRecorded = async () => {
    await fetchData() // Refresh all data to get updated ratings
  }

  const handleGameUpdate = async () => {
    // Refresh games list
    const gamesRes = await fetch('/api/games')
    const gamesData = await gamesRes.json()
    setGames(gamesData)
  }

  const handleChallengeUpdate = async () => {
    await fetchData() // Refresh all data including challenges
  }

  const pendingChallengesForUser = currentUser 
    ? challenges.filter(c => c.status === 'pending' && c.challengedId === currentUser.id).length
    : 0

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <div>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>
          🏆 Leaderboard
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px' }}>
          ELO Rating System • Track Your Victories
        </p>
        
        {users.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{ color: 'white', fontWeight: '600' }}>
              Who are you?
            </label>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value)
                setCurrentUser(user || null)
              }}
              style={{ 
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid white',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              <option value="">Select your name...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            {pendingChallengesForUser > 0 && (
              <span style={{
                background: '#e74c3c',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                {pendingChallengesForUser} pending challenge{pendingChallengesForUser > 1 ? 's' : ''}!
              </span>
            )}
          </div>
        )}
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          📊 Leaderboard
        </button>
        <button 
          className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          ⚔️ Challenges
          {pendingChallengesForUser > 0 && (
            <span style={{
              background: '#e74c3c',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              marginLeft: '6px',
              fontWeight: '700'
            }}>
              {pendingChallengesForUser}
            </span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          🎮 Record Match
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
        <button 
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          ⚙️ Manage
        </button>
      </div>

      {activeTab === 'leaderboard' && (
        <Leaderboard users={users} />
      )}

      {activeTab === 'challenges' && (
        <div>
          <CreateChallenge 
            users={users}
            games={games}
            currentUser={currentUser}
            onChallengeCreated={handleChallengeUpdate}
          />
          <div style={{ marginTop: '24px' }}>
            <Challenges 
              challenges={challenges}
              users={users}
              currentUser={currentUser}
              onChallengeUpdate={handleChallengeUpdate}
            />
          </div>
        </div>
      )}

      {activeTab === 'record' && (
        <RecordMatch 
          users={users} 
          games={games}
          onMatchRecorded={handleMatchRecorded} 
        />
      )}

      {activeTab === 'history' && (
        <MatchHistory matches={matches} />
      )}

      {activeTab === 'manage' && (
        <div className="container">
          <ManageUsers users={users} onUserUpdated={handleUserUpdate} />
          <AddGame games={games} onGameAdded={handleGameUpdate} />
        </div>
      )}
    </div>
  )
}

export default App

