import { useState } from 'react'

function Challenges({ challenges, users, currentUser, onChallengeUpdate }) {
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState({})
  const [error, setError] = useState('')

  const handleAccept = async (challengeId) => {
    setError('')
    setLoading(prev => ({ ...prev, [challengeId]: true }))

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept challenge')
      }

      onChallengeUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, [challengeId]: false }))
    }
  }

  const handleDecline = async (challengeId) => {
    setError('')
    setLoading(prev => ({ ...prev, [challengeId]: true }))

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'declined' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to decline challenge')
      }

      onChallengeUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, [challengeId]: false }))
    }
  }

  const handleDelete = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) {
      return
    }

    setLoading(prev => ({ ...prev, [challengeId]: true }))

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete challenge')
      }

      onChallengeUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, [challengeId]: false }))
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#f39c12', color: 'white' },
      accepted: { background: '#27ae60', color: 'white' },
      declined: { background: '#e74c3c', color: 'white' },
      completed: { background: '#95a5a6', color: 'white' }
    }

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    )
  }

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'all') return true
    if (filter === 'incoming') return currentUser && challenge.challengedId === currentUser.id
    if (filter === 'outgoing') return currentUser && challenge.challengerId === currentUser.id
    if (filter === 'pending') return challenge.status === 'pending'
    if (filter === 'accepted') return challenge.status === 'accepted'
    return true
  })

  return (
    <div className="card">
      <h2>⚔️ Challenges</h2>

      {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

      {currentUser && (
        <div style={{ marginBottom: '24px' }}>
          <label>Filter:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginTop: '8px' }}
          >
            <option value="all">All Challenges</option>
            <option value="incoming">Incoming (for {currentUser.name})</option>
            <option value="outgoing">Outgoing (from {currentUser.name})</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      )}

      {filteredChallenges.length === 0 ? (
        <div className="empty-state">
          <div className="trophy">🏆</div>
          <p>No challenges yet. Issue your first challenge!</p>
        </div>
      ) : (
        <div>
          {filteredChallenges.map((challenge) => {
            const isIncoming = currentUser && challenge.challengedId === currentUser.id
            const isOutgoing = currentUser && challenge.challengerId === currentUser.id
            const isPending = challenge.status === 'pending'

            return (
              <div key={challenge.id} className="match-item" style={{
                borderLeft: `4px solid ${isPending ? '#f39c12' : challenge.status === 'accepted' ? '#27ae60' : '#95a5a6'}`
              }}>
                <div className="match-header">
                  <div className="match-players">
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                      {challenge.challengerName}
                    </span>
                    {' challenges '}
                    <span style={{ fontWeight: 'bold', color: '#764ba2' }}>
                      {challenge.challengedName}
                    </span>
                  </div>
                  <span className="match-game">{challenge.game}</span>
                </div>
                
                <div className="match-details">
                  {challenge.message && (
                    <div style={{ 
                      fontStyle: 'italic', 
                      color: '#666', 
                      marginBottom: '8px',
                      padding: '8px',
                      background: '#f9f9f9',
                      borderRadius: '4px'
                    }}>
                      "{challenge.message}"
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getStatusBadge(challenge.status)}
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {formatDate(challenge.createdAt)}
                      </span>
                    </div>
                    
                    {isPending && isIncoming && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAccept(challenge.id)}
                          disabled={loading[challenge.id]}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            background: '#27ae60'
                          }}
                        >
                          {loading[challenge.id] ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleDecline(challenge.id)}
                          disabled={loading[challenge.id]}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            background: '#e74c3c'
                          }}
                        >
                          {loading[challenge.id] ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    )}
                    
                    {(isPending || challenge.status === 'declined') && isOutgoing && (
                      <button
                        onClick={() => handleDelete(challenge.id)}
                        disabled={loading[challenge.id]}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#95a5a6'
                        }}
                      >
                        {loading[challenge.id] ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
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

export default Challenges

