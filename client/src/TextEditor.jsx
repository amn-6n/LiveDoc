import { useCallback, useEffect, useState } from 'react'
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { Document as DocxDocument, Paragraph as DocxParagraph, TextRun as DocxTextRun } from 'docx'
import * as mammoth from 'mammoth'

const SAVE_INTERVAL_MS = 2000

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
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [documentTitle, setDocumentTitle] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const s = io('http://localhost:3001')
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    if (socket == null || quill == null) return
    
    socket.once("load-document", ({ document, isOwner, permissions }) => {
      quill.setContents(document.data)
      setIsOwner(isOwner)
      setPermissions(permissions)
      if (permissions.includes(PERMISSIONS.EDIT)) {
        quill.enable()
      } else {
        quill.disable()
      }
    })

    socket.emit('get-document', documentId)

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta)
    })

    return () => {
      socket.off('receive-changes')
    }
  }, [socket, quill, documentId])

  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      if (permissions.includes(PERMISSIONS.EDIT)) {
        socket.emit('save-document', quill.getContents())
      }
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill, permissions])

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {
      if(source !== 'user') return 
      socket.emit("send-changes", delta)
    }

    quill.on('text-change', handler)

    return () => {
      quill.off('text-change', handler)
    }
  },[socket, quill])

  const handleSave = () => {
    setShowSaveModal(true)
  }

  const handleSaveConfirm = async () => {
    if (documentTitle.trim()) {
      // Save to server
      socket.emit('update-title', { docId: documentId, title: documentTitle })
      socket.emit('save-document', quill.getContents())

      // Save to system as DOCX
      const content = quill.getContents()
      
      // Create DOCX document
      const doc = new Document({
        title: documentTitle,
        description: "Document created with LiveDoc",
        sections: [{
          properties: {},
          children: content.ops.map(op => {
            if (op.insert) {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: op.insert,
                    bold: op.attributes?.bold,
                    italic: op.attributes?.italic,
                    underline: op.attributes?.underline
                  })
                ]
              })
            }
            return new Paragraph({})
          })
        }]
      })

      // Convert to blob and download
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${documentTitle.replace(/\s+/g, '_')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setShowSaveModal(false)
      navigate('/')
    }
  }

  const handleFileOpen = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const doc = await DocxDocument.load(arrayBuffer)
      
      // Convert document content to Quill delta format
      const content = {
        ops: []
      }

      // Process each paragraph
      for (const paragraph of doc.paragraphs) {
        // Skip empty paragraphs
        if (!paragraph.text.trim()) {
          content.ops.push({ insert: '\n' })
          continue
        }

        // Process each run (text with consistent formatting)
        for (const run of paragraph.runs) {
          if (!run.text.trim()) continue

          const attributes = {}
          
          // Check for formatting
          if (run.bold) attributes.bold = true
          if (run.italic) attributes.italic = true
          if (run.underline) attributes.underline = true

          // Add the text with its formatting
          content.ops.push({
            insert: run.text,
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined
          })
        }

        // Add a newline after each paragraph
        content.ops.push({ insert: '\n' })
      }

      // Clean up the content
      content.ops = content.ops.filter(op => {
        if (op.insert) {
          // Remove empty text operations
          if (op.insert.trim() === '' && op.insert !== '\n') {
            return false
          }
          // Clean up whitespace
          op.insert = op.insert.replace(/\s+/g, ' ')
        }
        return true
      })

      // Update the editor content
      if (quill) {
        quill.setContents(content)
      }

      // Update the document title
      setDocumentTitle(file.name.replace('.docx', ''))

    } catch (error) {
      console.error('Error opening document:', error)
      alert('Error opening document. Please make sure it is a valid DOCX file.')
    }
  }

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return 

    wrapper.innerHTML = ""
    const editor = document.createElement('div')
    wrapper.append(editor)
    const q = new Quill(editor,  { theme : 'snow', modules: { toolbar:TOOLBAR_OPTIONS} })
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, [])

  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/join/${documentId}`
    setShareLink(link)
    setShowShareModal(true)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('Share link copied to clipboard!')
  }

  return (
    <>
      <div className="editor-container">
        <div className="container" ref={wrapperRef}></div>
        <div className="editor-buttons">
          <button className="share-btn" onClick={generateShareLink}>Share Document</button>
          <button className="save-btn" onClick={handleSave}>Save & Exit</button>
        </div>
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

