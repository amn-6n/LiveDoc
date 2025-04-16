import React from 'react'

const demo = () => {
  return (
    <div>
        
       <h2>Join or Create a Room</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
                setUsername(e.target.value);
                localStorage.setItem('username', e.target.value); 
            }}
            placeholder="Enter Username"
          />
        </div>
        <div>
          <label htmlFor="roomCode">Room Code:</label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter Room Id (optional)"
          />
          <button type="button" onClick={generateRoomCode}>
            Create Room Id
          </button>
        </div>
        <button type="submit">Join Room</button>
      </form>

    </div>
  )
}

export default demo
