import { useState } from 'react'

function ManageUsers({ users, onUserUpdated }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(prev => ({ ...prev, add: true }))

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user')
      }

      setSuccess(`User "${newName}" added successfully!`)
      setNewName('')
      onUserUpdated()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, add: false }))
    }
  }

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditName(user.name)
    setError('')
    setSuccess('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setError('')
  }

  const handleSaveEdit = async (userId) => {
    setError('')
    setSuccess('')
    setLoading(prev => ({ ...prev, [userId]: true }))

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccess(`User renamed successfully!`)
      setEditingId(null)
      setEditName('')
      onUserUpdated()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) {
      return
    }

    setError('')
    setSuccess('')
    setLoading(prev => ({ ...prev, [userId]: true }))

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setSuccess(`User "${userName}" deleted successfully!`)
      onUserUpdated()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="card">
      <h2>👤 Manage Users</h2>
      
      {/* Add User Form */}
      <form onSubmit={handleAddUser} style={{ marginBottom: '32px' }}>
        <div className="form-group">
          <label htmlFor="username">Add New User</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="username"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter user name"
              required
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={loading.add} style={{ width: 'auto' }}>
              {loading.add ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="success" style={{ marginBottom: '16px' }}>{success}</div>}

      {/* User List */}
      <div>
        <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>
          All Users ({users.length})
        </h3>
        
        {users.length === 0 ? (
          <div className="empty-state">
            <p>No users yet. Add your first user above!</p>
          </div>
        ) : (
          <div>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '16px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                {editingId === user.id ? (
                  // Edit Mode
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSaveEdit(user.id)}
                        disabled={loading[user.id]}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#27ae60'
                        }}
                      >
                        {loading[user.id] ? 'Saving...' : '✓ Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading[user.id]}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#95a5a6'
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Rating: {user.rating} • W/L: {user.totalWins}/{user.totalLosses}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={loading[user.id]}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#3498db'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={loading[user.id]}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#e74c3c'
                        }}
                      >
                        {loading[user.id] ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageUsers

