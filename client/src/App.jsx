import TextEditor from "./TextEditor"
import DocumentList from "./DocumentList"
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import RoomForm from "./RoomForm"
import { Toaster } from 'react-hot-toast';

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
          <Route path="/" element={<RoomForm />} />
          <Route path="/documents/:id" element={<TextEditor />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
