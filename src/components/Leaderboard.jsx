import { useState } from 'react'

function Leaderboard({ users }) {
  const [selectedGame, setSelectedGame] = useState('overall')

  // Extract all games from users' game stats
  const allGames = [...new Set(
    users.flatMap(user => Object.keys(user.gameStats))
  )].sort()

  const getSortedUsers = () => {
    if (selectedGame === 'overall') {
      return [...users].sort((a, b) => b.rating - a.rating)
    } else {
      return [...users]
        .filter(user => user.gameStats[selectedGame])
        .sort((a, b) => {
          const aRating = a.gameStats[selectedGame]?.rating || 0
          const bRating = b.gameStats[selectedGame]?.rating || 0
          return bRating - aRating
        })
    }
  }

  const sortedUsers = getSortedUsers()

  return (
    <div className="card">
      <div style={{ marginBottom: '24px' }}>
        <label>Filter by Game:</label>
        <select 
          value={selectedGame} 
          onChange={(e) => setSelectedGame(e.target.value)}
          style={{ marginTop: '8px' }}
        >
          <option value="overall">Overall Ranking</option>
          {allGames.map(game => (
            <option key={game} value={game}>{game}</option>
          ))}
        </select>
      </div>

      {sortedUsers.length === 0 ? (
        <div className="empty-state">
          <div className="trophy">🏆</div>
          <p>No users yet. Add some users to get started!</p>
        </div>
      ) : (
        <div>
          {sortedUsers.map((user, index) => {
            const rank = index + 1
            let rankClass = ''
            if (rank === 1) rankClass = 'rank-1'
            else if (rank === 2) rankClass = 'rank-2'
            else if (rank === 3) rankClass = 'rank-3'

            const gameStats = selectedGame !== 'overall' 
              ? user.gameStats[selectedGame] 
              : null

            const displayRating = selectedGame !== 'overall'
              ? (gameStats?.rating || 1200)
              : user.rating
            
            const wins = selectedGame !== 'overall' 
              ? (gameStats?.wins || 0)
              : user.totalWins
            const losses = selectedGame !== 'overall'
              ? (gameStats?.losses || 0)
              : user.totalLosses
            const winRate = wins + losses > 0 
              ? ((wins / (wins + losses)) * 100).toFixed(1)
              : 0

            return (
              <div 
                key={user.id} 
                style={{ 
                  padding: '20px',
                  borderBottom: index < sortedUsers.length - 1 ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div 
                    style={{ 
                      fontSize: '24px',
                      fontWeight: 'bold',
                      minWidth: '50px',
                      color: rank <= 3 ? '#667eea' : '#999'
                    }}
                  >
                    #{rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                      {user.name}
                      {rank <= 3 && (
                        <span className={`badge ${rankClass}`}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <div className="stats">
                      <div className="stat-item">
                        <span className="stat-label">
                          {selectedGame !== 'overall' ? `${selectedGame} Rating:` : 'Overall Rating:'}
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                          {displayRating}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">W/L:</span>
                        <span>{wins}/{losses}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Win Rate:</span>
                        <span>{winRate}%</span>
                      </div>
                      {selectedGame === 'overall' && Object.keys(user.gameStats).length > 0 && (
                        <div className="stat-item">
                          <span className="stat-label">Games Played:</span>
                          <span>{Object.keys(user.gameStats).length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Leaderboard

