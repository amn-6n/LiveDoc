import TextEditor from "./TextEditor"
import DocumentList from "./DocumentList"
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import RoomForm from "./RoomForm"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomForm />} />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  )
}

export default App
