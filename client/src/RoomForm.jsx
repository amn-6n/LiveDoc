import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidV4} from 'uuid'

const RoomForm = () => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const generateRoomCode = () => {
    const uniqueCode = uuidV4()
    setRoomCode(uniqueCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && roomCode) {
       navigate(`/documents/${roomCode}`)
    } else {
      alert('Please fill in all fields!');
    }
  };

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
            placeholder="Enter your username"
          />
        </div>
        <div>
          <label htmlFor="roomCode">Room Code:</label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code (optional)"
          />
          <button type="button" onClick={generateRoomCode}>
            Create Room
          </button>
        </div>
        <button type="submit">Join Room</button>
      </form>
    </div>


  );
};

export default RoomForm;