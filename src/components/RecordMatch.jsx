import { useState } from 'react'

function RecordMatch({ users, games, onMatchRecorded }) {
  const [matchType, setMatchType] = useState('1v1') // '1v1' or '4player'
  const [winnerId, setWinnerId] = useState('')
  const [loserId, setLoserId] = useState('')
  const [game, setGame] = useState('')
  
  // For 4-player matches
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [player3Id, setPlayer3Id] = useState('')
  const [player4Id, setPlayer4Id] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit1v1 = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, loserId, game }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record match')
      }

      setSuccess(`Match recorded! ${data.winnerName} defeated ${data.loserName} (+${data.ratingChange} ELO)`)
      setWinnerId('')
      setLoserId('')
      setGame('')
      
      onMatchRecorded()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit4Player = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const playerIds = [player1Id, player2Id, player3Id, player4Id]
      
      const response = await fetch('/api/matches/multiplayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds, game }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record match')
      }

      setSuccess(`4-player match recorded! Winner: ${data.players[0].name}`)
      setPlayer1Id('')
      setPlayer2Id('')
      setPlayer3Id('')
      setPlayer4Id('')
      setGame('')
      
      onMatchRecorded()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = matchType === '1v1' ? handleSubmit1v1 : handleSubmit4Player

  return (
    <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2>⚔️ Record Match Result</h2>
      
      {users.length < 2 ? (
        <div className="empty-state">
          <p>You need at least {matchType === '4player' ? '4' : '2'} users to record a match.</p>
        </div>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <p>You need to add at least one game first.</p>
        </div>
      ) : (
        <>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setMatchType('1v1')}
                style={{
                  flex: 1,
                  background: matchType === '1v1' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
                  color: matchType === '1v1' ? 'white' : '#666'
                }}
              >
                1v1 Match
              </button>
              <button
                type="button"
                onClick={() => setMatchType('4player')}
                style={{
                  flex: 1,
                  background: matchType === '4player' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
                  color: matchType === '4player' ? 'white' : '#666'
                }}
                disabled={users.length < 4}
              >
                4-Player Match
              </button>
            </div>
          </div>

          {matchType === '1v1' ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="game">Game</label>
                <select
                  id="game"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  required
                >
                  <option value="">Select a game...</option>
                  {games.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="winner">Winner</label>
                <select
                  id="winner"
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                  required
                >
                  <option value="">Select winner...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="loser">Loser</label>
                <select
                  id="loser"
                  value={loserId}
                  onChange={(e) => setLoserId(e.target.value)}
                  required
                >
                  <option value="">Select loser...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Recording...' : 'Record Match'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="game4p">Game</label>
                <select
                  id="game4p"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  required
                >
                  <option value="">Select a game...</option>
                  {games.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ 
                background: '#f0f7ff', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                border: '2px solid #667eea'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#667eea', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  📋 Select players in order of placement (1st to 4th)
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="player1">🥇 1st Place</label>
                <select
                  id="player1"
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  required
                >
                  <option value="">Select 1st place...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="player2">🥈 2nd Place</label>
                <select
                  id="player2"
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  required
                >
                  <option value="">Select 2nd place...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="player3">🥉 3rd Place</label>
                <select
                  id="player3"
                  value={player3Id}
                  onChange={(e) => setPlayer3Id(e.target.value)}
                  required
                >
                  <option value="">Select 3rd place...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="player4">4️⃣ 4th Place</label>
                <select
                  id="player4"
                  value={player4Id}
                  onChange={(e) => setPlayer4Id(e.target.value)}
                  required
                >
                  <option value="">Select 4th place...</option>
                  {users.map((user) => {
                    const gameRating = game && user.gameStats[game]?.rating
                    const displayRating = gameRating || user.rating
                    const ratingLabel = gameRating ? `${game} Rating` : 'Overall'
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({ratingLabel}: {displayRating})
                      </option>
                    )
                  })}
                </select>
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Recording...' : 'Record 4-Player Match'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}

export default RecordMatch
