import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  initializeFirebase,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  getAllMatches,
  createMatch,
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getGames,
  addGame,
  deleteGame
} from './firebase.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize Firebase (gracefully handles if not configured)
const db = initializeFirebase();

// In-memory storage (fallback when Firebase is not configured)
let users = [];
let matches = [];
let challenges = [];
let games = ['Chess', 'Ping Pong', 'Pool', 'Foosball', 'Street Fighter', 'Mario Kart'];

// ELO calculation functions
const INITIAL_RATING = 1200;
const K_FACTOR = 32;

function calculateExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateNewRating(currentRating, expectedScore, actualScore) {
  return Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
}

function updateEloRatings(winner, loser, game) {
  // Initialize game-specific stats if needed
  if (!winner.gameStats[game]) {
    winner.gameStats[game] = { wins: 0, losses: 0, rating: INITIAL_RATING };
  }
  if (!loser.gameStats[game]) {
    loser.gameStats[game] = { wins: 0, losses: 0, rating: INITIAL_RATING };
  }
  
  // Use game-specific ratings for calculation
  const winnerGameRating = winner.gameStats[game].rating;
  const loserGameRating = loser.gameStats[game].rating;
  
  const expectedWinner = calculateExpectedScore(winnerGameRating, loserGameRating);
  const expectedLoser = calculateExpectedScore(loserGameRating, winnerGameRating);
  
  const newWinnerRating = calculateNewRating(winnerGameRating, expectedWinner, 1);
  const newLoserRating = calculateNewRating(loserGameRating, expectedLoser, 0);
  
  const ratingChange = newWinnerRating - winnerGameRating;
  
  // Update game-specific ratings
  winner.gameStats[game].rating = newWinnerRating;
  loser.gameStats[game].rating = newLoserRating;
  
  // Update stats
  winner.gameStats[game].wins++;
  loser.gameStats[game].losses++;
  
  winner.totalWins++;
  loser.totalLosses++;
  
  // Update overall rating as average of all game ratings
  updateOverallRating(winner);
  updateOverallRating(loser);
  
  return ratingChange;
}

function updateOverallRating(user) {
  const gameRatings = Object.values(user.gameStats).map(stats => stats.rating);
  if (gameRatings.length > 0) {
    user.rating = Math.round(gameRatings.reduce((sum, r) => sum + r, 0) / gameRatings.length);
  }
}

// Multiplayer ELO calculation (for 4-player games)
function updateMultiplayerEloRatings(players, game) {
  // players is an array of {user, placement} objects, sorted by placement (1st to 4th)
  const n = players.length;
  const ratingChanges = [];
  
  // Initialize game-specific stats and store original ratings
  players.forEach(p => {
    if (!p.user.gameStats[game]) {
      p.user.gameStats[game] = { wins: 0, losses: 0, rating: INITIAL_RATING };
    }
    // Use game-specific rating for this game
    p.originalRating = p.user.gameStats[game].rating;
  });
  
  // Calculate rating changes by comparing each pair
  players.forEach((player, i) => {
    let totalExpected = 0;
    let totalActual = 0;
    
    // Compare this player with every other player
    players.forEach((opponent, j) => {
      if (i !== j) {
        const expected = calculateExpectedScore(player.originalRating, opponent.originalRating);
        // If this player placed better (lower number = better), they "won" this pairing
        const actual = player.placement < opponent.placement ? 1 : 0;
        
        totalExpected += expected;
        totalActual += actual;
      }
    });
    
    // Calculate rating change based on average performance against all opponents
    const avgExpected = totalExpected / (n - 1);
    const avgActual = totalActual / (n - 1);
    const ratingChange = Math.round(K_FACTOR * (avgActual - avgExpected));
    
    // Update game-specific rating
    player.user.gameStats[game].rating += ratingChange;
    ratingChanges.push(ratingChange);
    
    // Count 1st place as a win, anything else as participation
    if (player.placement === 1) {
      player.user.gameStats[game].wins++;
      player.user.totalWins++;
    } else {
      player.user.gameStats[game].losses++;
      player.user.totalLosses++;
    }
    
    // Update overall rating as average of all games
    updateOverallRating(player.user);
  });
  
  return ratingChanges;
}

// API Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = db ? await getAllUsers() : users;
    const sortedUsers = [...allUsers].sort((a, b) => b.rating - a.rating);
    res.json(sortedUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Add a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const allUsers = db ? await getAllUsers() : users;
    const existingUser = allUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      rating: INITIAL_RATING,
      totalWins: 0,
      totalLosses: 0,
      gameStats: {},
      createdAt: new Date().toISOString()
    };
    
    if (db) {
      const created = await createUser(newUser);
      res.status(201).json(created);
    } else {
      users.push(newUser);
      res.status(201).json(newUser);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user's name
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    console.log('UPDATE USER REQUEST:', { id: req.params.id, name, hasDB: !!db, usersCount: users.length });
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (db) {
      const allUsers = await getAllUsers();
      console.log('All users from DB:', allUsers.map(u => ({ id: u.id, name: u.name })));
      const user = allUsers.find(u => u.id === req.params.id);
      
      if (!user) {
        console.log('User not found with ID:', req.params.id);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if name already exists (excluding current user)
      const existingUser = allUsers.find(u => 
        u.name.toLowerCase() === name.trim().toLowerCase() && u.id !== req.params.id
      );
      if (existingUser) {
        return res.status(400).json({ error: 'User with this name already exists' });
      }
      
      user.name = name.trim();
      console.log('Updating user in Firebase:', user.id, 'with name:', user.name);
      await updateUser(user.id, { name: user.name });
      console.log('Update successful');
      res.json(user);
    } else {
      // In-memory mode
      const user = users.find(u => u.id === req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if name already exists (excluding current user)
      const existingUser = users.find(u => 
        u.name.toLowerCase() === name.trim().toLowerCase() && u.id !== req.params.id
      );
      if (existingUser) {
        return res.status(400).json({ error: 'User with this name already exists' });
      }
      
      user.name = name.trim();
      res.json(user);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    if (db) {
      const user = await getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await db.collection('users').doc(req.params.id).delete();
    } else {
      const userIndex = users.findIndex(u => u.id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      users.splice(userIndex, 1);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all matches
app.get('/api/matches', async (req, res) => {
  try {
    const allMatches = db ? await getAllMatches() : matches;
    res.json(allMatches);
  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// Record a match
app.post('/api/matches', async (req, res) => {
  try {
    const { winnerId, loserId, game } = req.body;
    
    if (!winnerId || !loserId || !game) {
      return res.status(400).json({ error: 'Winner, loser, and game are required' });
    }
    
    if (winnerId === loserId) {
      return res.status(400).json({ error: 'Winner and loser must be different users' });
    }
    
    const allUsers = db ? await getAllUsers() : users;
    const winner = allUsers.find(u => u.id === winnerId);
    const loser = allUsers.find(u => u.id === loserId);
    
    if (!winner || !loser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const winnerRatingBefore = winner.rating;
    const loserRatingBefore = loser.rating;
    
    const ratingChange = updateEloRatings(winner, loser, game);
    
    const match = {
      id: Date.now().toString(),
      winnerId: winner.id,
      winnerName: winner.name,
      winnerRatingBefore,
      winnerRatingAfter: winner.rating,
      loserId: loser.id,
      loserName: loser.name,
      loserRatingBefore,
      loserRatingAfter: loser.rating,
      game,
      ratingChange,
      date: new Date().toISOString()
    };
    
    if (db) {
      // Update users in Firebase
      await updateUser(winner.id, winner);
      await updateUser(loser.id, loser);
      // Create match in Firebase
      const created = await createMatch(match);
      res.status(201).json(created);
    } else {
      // Update in-memory users (already modified by updateEloRatings)
      matches.push(match);
      res.status(201).json(match);
    }
  } catch (error) {
    console.error('Error recording match:', error);
    res.status(500).json({ error: 'Failed to record match' });
  }
});

// Record a multiplayer match (4 players)
app.post('/api/matches/multiplayer', async (req, res) => {
  try {
    const { playerIds, game } = req.body;
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length !== 4) {
      return res.status(400).json({ error: 'Exactly 4 player IDs required in placement order' });
    }
    
    if (!game) {
      return res.status(400).json({ error: 'Game is required' });
    }
    
    // Check for duplicate players
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== 4) {
      return res.status(400).json({ error: 'All players must be different' });
    }
    
    const allUsers = db ? await getAllUsers() : users;
    
    // Get all player objects
    const players = playerIds.map((id, index) => {
      const user = allUsers.find(u => u.id === id);
      if (!user) {
        return null;
      }
      return {
        user,
        placement: index + 1, // 1st, 2nd, 3rd, 4th
        ratingBefore: user.rating
      };
    });
    
    if (players.includes(null)) {
      return res.status(404).json({ error: 'One or more users not found' });
    }
    
    // Update ELO ratings
    const ratingChanges = updateMultiplayerEloRatings(players, game);
    
    // Create match record
    const match = {
      id: Date.now().toString(),
      type: 'multiplayer',
      game,
      players: players.map((p, index) => ({
        id: p.user.id,
        name: p.user.name,
        placement: p.placement,
        ratingBefore: p.ratingBefore,
        ratingAfter: p.user.rating,
        ratingChange: ratingChanges[index]
      })),
      date: new Date().toISOString()
    };
    
    if (db) {
      // Update all players in Firebase
      for (const player of players) {
        await updateUser(player.user.id, player.user);
      }
      // Create match in Firebase
      const created = await createMatch(match);
      res.status(201).json(created);
    } else {
      matches.push(match);
      res.status(201).json(match);
    }
  } catch (error) {
    console.error('Error recording multiplayer match:', error);
    res.status(500).json({ error: 'Failed to record multiplayer match' });
  }
});

// Get available games
app.get('/api/games', async (req, res) => {
  try {
    const allGames = db ? await getGames() : games;
    res.json(allGames);
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Add a new game
app.post('/api/games', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Game name is required' });
    }
    
    const allGames = db ? await getGames() : games;
    
    if (allGames.includes(name.trim())) {
      return res.status(400).json({ error: 'Game already exists' });
    }
    
    if (db) {
      await addGame(name.trim());
    } else {
      games.push(name.trim());
    }
    
    res.status(201).json({ name: name.trim() });
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Failed to add game' });
  }
});

// Delete a game
app.delete('/api/games/:name', async (req, res) => {
  try {
    const gameName = decodeURIComponent(req.params.name);
    
    if (db) {
      await deleteGame(gameName);
    } else {
      const gameIndex = games.findIndex(g => g === gameName);
      if (gameIndex !== -1) {
        games.splice(gameIndex, 1);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// Get user stats
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = db ? await getUserById(req.params.id) : users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const allMatches = db ? await getAllMatches() : matches;
    const userMatches = allMatches.filter(m => 
      m.winnerId === user.id || m.loserId === user.id
    );
    
    res.json({
      ...user,
      matches: userMatches
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// Challenge endpoints

// Get all challenges
app.get('/api/challenges', async (req, res) => {
  try {
    const allChallenges = db ? await getAllChallenges() : challenges;
    res.json(allChallenges);
  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// Create a challenge
app.post('/api/challenges', async (req, res) => {
  try {
    const { challengerId, challengedId, game, message } = req.body;
    
    if (!challengerId || !challengedId || !game) {
      return res.status(400).json({ error: 'Challenger, challenged user, and game are required' });
    }
    
    if (challengerId === challengedId) {
      return res.status(400).json({ error: 'You cannot challenge yourself' });
    }
    
    const allUsers = db ? await getAllUsers() : users;
    const challenger = allUsers.find(u => u.id === challengerId);
    const challenged = allUsers.find(u => u.id === challengedId);
    
    if (!challenger || !challenged) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const challenge = {
      id: Date.now().toString(),
      challengerId: challenger.id,
      challengerName: challenger.name,
      challengedId: challenged.id,
      challengedName: challenged.name,
      game,
      message: message || '',
      status: 'pending', // pending, accepted, declined, completed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (db) {
      const created = await createChallenge(challenge);
      res.status(201).json(created);
    } else {
      challenges.push(challenge);
      res.status(201).json(challenge);
    }
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Update challenge status (accept/decline)
app.patch('/api/challenges/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (accepted/declined) is required' });
    }
    
    const challenge = db ? await getChallengeById(req.params.id) : challenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'Challenge has already been responded to' });
    }
    
    challenge.status = status;
    challenge.updatedAt = new Date().toISOString();
    
    if (db) {
      await updateChallenge(challenge.id, { status, updatedAt: challenge.updatedAt });
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// Complete a challenge (when match is recorded)
app.patch('/api/challenges/:id/complete', async (req, res) => {
  try {
    const challenge = db ? await getChallengeById(req.params.id) : challenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    if (challenge.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted challenges can be completed' });
    }
    
    challenge.status = 'completed';
    challenge.updatedAt = new Date().toISOString();
    
    if (db) {
      await updateChallenge(challenge.id, { status: 'completed', updatedAt: challenge.updatedAt });
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// Delete a challenge
app.delete('/api/challenges/:id', async (req, res) => {
  try {
    const challenge = db ? await getChallengeById(req.params.id) : challenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Only allow deletion of pending or declined challenges
    if (challenge.status === 'accepted' || challenge.status === 'completed') {
      return res.status(400).json({ error: 'Cannot delete accepted or completed challenges' });
    }
    
    if (db) {
      await deleteChallenge(challenge.id);
    } else {
      const challengeIndex = challenges.findIndex(c => c.id === req.params.id);
      challenges.splice(challengeIndex, 1);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

