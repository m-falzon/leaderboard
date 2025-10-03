import { useState } from 'react'

function CreateChallenge({ users, games, currentUser, onChallengeCreated }) {
  const [challengerId, setChallengerId] = useState(currentUser?.id || '')
  const [challengedId, setChallengedId] = useState('')
  const [game, setGame] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          challengerId, 
          challengedId, 
          game,
          message 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create challenge')
      }

      setSuccess(`Challenge sent! You challenged ${data.challengedName} to ${game}`)
      setChallengedId('')
      setGame('')
      setMessage('')
      
      onChallengeCreated()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>⚔️ Issue a Challenge</h2>
      
      {users.length < 2 ? (
        <div className="empty-state">
          <p>You need at least 2 users to issue a challenge.</p>
        </div>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <p>You need to add at least one game first.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="challenger">You are (Challenger)</label>
            <select
              id="challenger"
              value={challengerId}
              onChange={(e) => setChallengerId(e.target.value)}
              required
            >
              <option value="">Select yourself...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="challenged">Challenge</label>
            <select
              id="challenged"
              value={challengedId}
              onChange={(e) => setChallengedId(e.target.value)}
              required
            >
              <option value="">Select opponent...</option>
              {users
                .filter(user => user.id !== challengerId)
                .map((user) => {
                  const gameRating = game && user.gameStats[game]?.rating
                  const displayRating = gameRating || user.rating
                  return (
                    <option key={user.id} value={user.id}>
                      {user.name} (Rating: {displayRating})
                    </option>
                  )
                })}
            </select>
          </div>

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
            <label htmlFor="message">Trash Talk (Optional)</label>
            <input
              id="message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to your challenge..."
              maxLength="200"
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending Challenge...' : 'Send Challenge'}
          </button>
        </form>
      )}
    </div>
  )
}

export default CreateChallenge

