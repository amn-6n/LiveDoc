import TextEditor from "./TextEditor"
import DocumentList from "./DocumentList"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import { v4 as uuidV4} from 'uuid'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DocumentList />} />
        <Route path="/documents/:id" element={<TextEditor />} />
        <Route path="/join/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  )
}

export default App
