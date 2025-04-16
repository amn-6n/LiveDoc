import { useCallback, useEffect, useRef, useState } from 'react'
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import mammoth from 'mammoth'
import './styles/TextEditor.css'

const SAVE_INTERVAL_MS = 2000
const SERVER_URL = 'http://localhost:3001'

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false]}],
  [{ font: []}],
  [{ list: "ordered"}, { list: "bullet"}],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

const PERMISSIONS = {
  READ: 'read',
  COMMENT: 'comment',
  EDIT: 'edit'
}

export default function TextEditor() {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState(null)
  const [quill, setQuill] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [documentTitle, setDocumentTitle] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [connectedUsers, setConnectedUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  
  const getUserInfo = () => {
    const username = localStorage.getItem('username')
    return {
      email: `${username}@gg.com`,
      username: username
    }
  }
  
  useEffect(() => {
    const s = io(SERVER_URL)
    setSocket(s)
    
    const userInfo = getUserInfo()
    s.emit('identify-user', userInfo)

    return () => {
      s.disconnect()
    }
  }, [])

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return 

    wrapper.innerHTML = ""
    const editor = document.createElement('div')
    wrapper.append(editor)
    editorRef.current = editor
    
    const q = new Quill(editor, { 
      theme: 'snow', 
      modules: { toolbar: TOOLBAR_OPTIONS } 
    })
    
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, [])

  useEffect(() => {
    if (!socket || !quill) return
    
    const handleLoadDocument = ({ document, isOwner, permissions, connectedUsers }) => {
      quill.setContents(document.data)
      setDocumentTitle(document.title || '')
      setIsOwner(isOwner)
      setPermissions(permissions)
      setConnectedUsers(connectedUsers || [])
      
      if (permissions.includes(PERMISSIONS.EDIT)) {
        quill.enable()
      }
    }

    socket.once("load-document", handleLoadDocument)
    socket.emit('get-document', documentId)

    socket.on("user-joined", (user) => {

      setNotifications(prev => [
        { 
          id: Date.now(), 
          message: `${user.username} joined the document`, 
          type: 'join' 
        },
        ...prev
      ].slice(0, 5)) 
    })
    
    socket.on("user-left", (user) => {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          message: `${user.username} left the document`, 
          type: 'leave' 
        },
        ...prev
      ].slice(0, 5))
    })
    
    socket.on("connected-users", (users) => {
      setConnectedUsers(users)
    })

    return () => {
      socket.off("load-document", handleLoadDocument)
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("connected-users")
      
      socket.emit('leave-document')
    }
  }, [socket, quill, documentId])

  useEffect(() => {
    if (!socket || !quill) return

    const handleReceiveChanges = (delta) => {
      quill.updateContents(delta)
    }

    socket.on('receive-changes', handleReceiveChanges)

    return () => {
      socket.off('receive-changes', handleReceiveChanges)
    }
  }, [socket, quill])

  // Handle sending changes to server
  useEffect(() => {
    if (!socket || !quill) return

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user') return 
      socket.emit("send-changes", delta)
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quill.off('text-change', handleTextChange)
    }
  }, [socket, quill])

  // Auto-save document periodically
  useEffect(() => {
    if (!socket || !quill || !permissions.includes(PERMISSIONS.EDIT)) return

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill, permissions])

  // Convert Quill content to DOCX
  const convertToDocx = async (content, title) => {
    try {
      // Create DOCX document
      const doc = new Document({
        title: title,
        description: "Document created with LiveDoc",
        sections: [{
          properties: {},
          children: content.ops.map(op => {
            if (typeof op.insert === 'string') {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: op.insert,
                    bold: op.attributes?.bold || false,
                    italic: op.attributes?.italic || false,
                    underline: op.attributes?.underline || false
                  })
                ]
              })
            }
            return new Paragraph({})
          })
        }]
      })

      return await Packer.toBlob(doc)
    } catch (error) {
      console.error('Error converting to DOCX:', error)
      throw new Error('Failed to convert document to DOCX format')
    }
  }

  // Download document as DOCX
  const downloadDocx = async (blob, fileName) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName.replace(/\s+/g, '_')}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Save and exit handler
  const handleSave = () => {
    setShowSaveModal(true)
  }

  // Handle save confirmation
  const handleSaveConfirm = async () => {
    if (!documentTitle.trim()) {
      alert('Please enter a document title')
      return
    }
    
    try {
      // Save to server
      socket.emit('update-title', { docId: documentId, title: documentTitle })
      socket.emit('save-document', quill.getContents())

      // Convert and download as DOCX
      const content = quill.getContents()
      const blob = await convertToDocx(content, documentTitle)
      await downloadDocx(blob, documentTitle)

      setShowSaveModal(false)
      
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error saving document. Please try again.')
    }
  }

  // Handle file upload for both text and DOCX files
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      if (file.name.endsWith('.docx')) {
        // Handle DOCX files
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const textContent = result.value
        
        // Update Quill editor with DOCX content
        if (quill) {
          quill.setText(textContent)
          
          // Save to server
          socket.emit('update-document', {
            id: documentId,
            data: quill.getContents()
          })
        }
      } else {
        // Handle text files
        const text = await file.text()
        
        // Update Quill editor with text content
        if (quill) {
          quill.setText(text)
          
          // Save to server
          socket.emit('update-document', {
            id: documentId,
            data: quill.getContents()
          })
        }
      }
      
      // Update document title from filename
      const filename = file.name.split('.').slice(0, -1).join('.')
      setDocumentTitle(filename)
      socket.emit('update-title', { docId: documentId, title: filename })
      
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
    }
    
    // Clear the file input to allow selecting the same file again
    event.target.value = null
  }

  // Generate and handle sharing
  const generateShareLink = () => {
  
    const link = `${documentId}`
    setShareLink(link)
    setShowShareModal(true)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => alert('Share link copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy:', err)
        alert('Failed to copy link. Please try again.')
      })
  }

  // Remove notification after a delay
  useEffect(() => {
    if (notifications.length === 0) return
    
    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 5000) // Remove oldest notification after 5 seconds
    
    return () => clearTimeout(timer)
  }, [notifications])

  return (
    <>
      <div className="editor-container">

        <div className="editor-header">
          <div className="documentTitle">

          <h2>{documentTitle || 'Untitled Document'}</h2>
          </div>

          <div className="connected-users">
            <span>Connected Users ({connectedUsers.length}): </span>
            {connectedUsers.map((user, index) => (
              <span key={user.email} className="user-badge">
                {user.username}
                {index < connectedUsers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
        
        <div className="container" ref={wrapperRef}></div>
        
        <div className="editor-buttons">
          <button className="share-btn" onClick={generateShareLink}>Share Document</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
          <button className='exit-btn' onClick={() => {
            socket.emit('leave-document')
            navigate('/')
          }}>Quit</button>
          <button 
            className="upload-btn" 
            onClick={() => fileInputRef.current?.click()}
          >
            Open File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".txt,.md,.doc,.docx"
          />
        </div>
        
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type === 'join' ? 'join' : 'leave'}`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="save-modal">
            <h2>Save Document</h2>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
              className="title-input"
            />
            <div className="modal-buttons">
              <button onClick={handleSaveConfirm} className="confirm-btn">Save</button>
              <button onClick={() => setShowSaveModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay">
          <div className="share-modal">
            <h2>Share Document</h2>
            <div className="share-link-container">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="share-link"
              />
              <button onClick={copyShareLink} className="copy-btn">Copy Link</button>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowShareModal(false)} className="close-btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}