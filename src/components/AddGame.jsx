import { useState } from 'react'

function AddGame({ games, onGameAdded }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add game')
      }

      setSuccess(`Game "${name}" added successfully!`)
      setName('')
      onGameAdded(data)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (gameName) => {
    if (!window.confirm(`Are you sure you want to delete "${gameName}"?`)) {
      return
    }

    setError('')
    setSuccess('')
    setDeleting(prev => ({ ...prev, [gameName]: true }))

    try {
      const response = await fetch(`/api/games/${encodeURIComponent(gameName)}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete game')
      }

      setSuccess(`Game "${gameName}" deleted successfully!`)
      onGameAdded() // Refresh the games list
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(prev => ({ ...prev, [gameName]: false }))
    }
  }

  return (
    <div className="card">
      <h2>🎮 Manage Games</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '12px' }}>
          Current Games ({games.length}):
        </h3>
        {games.length === 0 ? (
          <p style={{ color: '#999' }}>No games added yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map((game) => (
              <div
                key={game}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f9f9f9',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: '500' }}>{game}</span>
                <button
                  onClick={() => handleDelete(game)}
                  disabled={deleting[game]}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    background: '#e74c3c'
                  }}
                >
                  {deleting[game] ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="gamename">Add New Game</label>
          <input
            id="gamename"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter game name"
            required
          />
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Game'}
        </button>
      </form>
    </div>
  )
}

export default AddGame

