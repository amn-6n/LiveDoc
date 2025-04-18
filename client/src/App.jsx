import TextEditor from "./TextEditor"
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import RoomForm from "./RoomForm"
import Register from './Auth/Register'
import Login from './Auth/Login'
import { Toaster } from 'react-hot-toast'
import PrivateRoute from './PrivateRoute'

function App() {
  return (
    <>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        ></Toaster>
      </div>

      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/join"
            element={
              <PrivateRoute>
                <RoomForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <PrivateRoute>
                <TextEditor />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </>
  )
}

export default App
