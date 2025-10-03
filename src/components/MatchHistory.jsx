import { useState } from 'react'

function MatchHistory({ matches }) {
  const [filter, setFilter] = useState('all')

  const games = [...new Set(matches.map(m => m.game))].sort()

  const filteredMatches = filter === 'all' 
    ? matches 
    : matches.filter(m => m.game === filter)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const renderMatch = (match) => {
    // Check if it's a multiplayer match
    if (match.type === 'multiplayer') {
      return (
        <div key={match.id} className="match-item" style={{ borderLeft: '4px solid #f39c12' }}>
          <div className="match-header">
            <div className="match-players">
              <span style={{ fontWeight: 'bold' }}>4-Player Match</span>
            </div>
            <span className="match-game">{match.game}</span>
          </div>
          
          <div className="match-details">
            {match.players.map((player, index) => {
              const placementEmoji = ['🥇', '🥈', '🥉', '4️⃣'][index]
              const isPositive = player.ratingChange > 0
              const changeColor = isPositive ? '#27ae60' : '#e74c3c'
              
              return (
                <div key={player.id} style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600' }}>
                    {placementEmoji} {player.name}:
                  </span>
                  {' '}
                  <span style={{ color: '#666' }}>
                    {player.ratingBefore} → {player.ratingAfter}
                  </span>
                  <span 
                    className="rating-change" 
                    style={{ color: changeColor }}
                  >
                    ({isPositive ? '+' : ''}{player.ratingChange})
                  </span>
                </div>
              )
            })}
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              {formatDate(match.date)}
            </div>
          </div>
        </div>
      )
    }

    // Regular 1v1 match
    return (
      <div key={match.id} className="match-item">
        <div className="match-header">
          <div className="match-players">
            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
              {match.winnerName}
            </span>
            {' vs '}
            <span style={{ color: '#e74c3c' }}>
              {match.loserName}
            </span>
          </div>
          <span className="match-game">{match.game}</span>
        </div>
        
        <div className="match-details">
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#27ae60' }}>
              {match.winnerName}: {match.winnerRatingBefore} → {match.winnerRatingAfter}
            </span>
            <span className="rating-change rating-up">
              (+{match.ratingChange})
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#e74c3c' }}>
              {match.loserName}: {match.loserRatingBefore} → {match.loserRatingAfter}
            </span>
            <span className="rating-change rating-down">
              (-{match.ratingChange})
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {formatDate(match.date)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>📜 Match History</h2>

      {games.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <label>Filter by Game:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginTop: '8px' }}
          >
            <option value="all">All Games</option>
            {games.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="empty-state">
          <div className="trophy">⚔️</div>
          <p>No matches recorded yet. Record your first match!</p>
        </div>
      ) : (
        <div>
          {filteredMatches.map(match => renderMatch(match))}
        </div>
      )}
    </div>
  )
}

export default MatchHistory
