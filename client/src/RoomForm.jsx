import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidV4 } from 'uuid'
import toast from 'react-hot-toast'

const RoomForm = () => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const generateRoomCode = () => {
    const uniqueCode = uuidV4()
    setRoomCode(uniqueCode);
    toast.success('Successfully Room Id Generated');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && roomCode) {
      navigate(`/documents/${roomCode}`)
    } else {
      toast.error('Room Id & Username Required');
    }
  };

  return (
    <div className='homePageWrapper'>
      <div className="formWrapper">

        <div className="title">
          <h1>Start Your </h1>
          <h1 className='sub-title'>Collaboration 🤝</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='inputGroup'>

            {/* <label htmlFor="username">Username:</label> */}
            <input
              type="text"
              className="inputBox"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                localStorage.setItem('username', e.target.value);
              }}
              placeholder="Enter Username"
            />

            {/* <label htmlFor="roomCode">Room Code:</label> */}
            <input
              type="text"
              className="inputBox"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter Room Id (optional)"
            />
          </div>

          <div className="btnGroup">
            <button className="btn joinBtn" type="submit">Join Room</button>

            <button className="btn createNewBtn" type="button" onClick={generateRoomCode}>
              Generate Room Id
            </button>
          </div>
        </form>

      </div>
      <footer>
        <h4>
          Built with ❤️ by &nbsp;
          <a href="https://github.com/codersgyan">AMN SINGH</a>
        </h4>
      </footer>
    </div>


  );
};

export default RoomForm;