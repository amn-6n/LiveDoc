import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';

const RoomForm = () => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const authToken = localStorage.getItem('token');

  useEffect(() => {
    if (!authToken) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/v1/users/myInfo`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        const data = await res.json();
        if (res.status === 200) {
          setUsername(data.username);
        } else {
          toast.error(data.message || 'Failed to fetch user info');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Server error fetching user info');
      }
    };

    fetchUserDetails();
  }, [authToken, navigate]);

  const generateRoomCode = () => {
    setRoomCode(uuidV4());
    toast.success('Successfully generated Room ID');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomCode || !username) {
      toast.error('Room ID & Username are required');
      return;
    }

    navigate(`/documents/${roomCode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="body">
      <div className='homePageWrapper'>
        <div className="formWrapper">
          <div className="title">
            <h1>Start Your</h1>
            <h1 className='sub-title'>Collaboration 🤝</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className='inputGroup'>
              <input
                type="text"
                className="inputBox"
                id="username"
                value={username}
                style={{ cursor: "not-allowed" }}
                disabled={true}
                placeholder="Username"
              />

              <input
                type="text"
                className="inputBox"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter Room ID (optional)"
              />
            </div>

            <div className="btnGroup">
              <button className="btn joinBtn" type="submit">Join Room</button>
              <button className="btn createNewBtn" type="button" onClick={generateRoomCode}>
                Generate Room ID
              </button>
              <button className="btn logoutBtn" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </form>
        </div>

        <footer>
          <h4>
            Built with ❤️ by &nbsp;
            <a href="https://github.com/codersgyan" target="_blank" rel="noopener noreferrer">AMN SINGH</a>
          </h4>
        </footer>
      </div>
    </div>
  );
};

export default RoomForm;
