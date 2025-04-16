// import { useState, useEffect, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { v4 as uuidV4 } from 'uuid'
// import { io } from 'socket.io-client'
// import mammoth from 'mammoth'

// export default function DocumentList() {
//   const [documents, setDocuments] = useState([])
//   const [editingTitle, setEditingTitle] = useState(null)
//   const [newTitle, setNewTitle] = useState('')
//   const fileInputRef = useRef(null)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const socket = io('http://localhost:3001')
    
//     // Request existing documents
//     socket.emit('get-documents')
    
//     // Listen for document list updates
//     socket.on('document-list', (docs) => {
//       setDocuments(docs)
//     })

//     return () => {
//       socket.disconnect()
//     }
//   }, [])

//   const createNewDocument = () => {
//     const newId = uuidV4()
//     navigate(`/documents/${newId}`)
//   }

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0]
//     if (!file) return

//     if (file.name.endsWith('.docx')) {
//       const reader = new FileReader()
//       reader.onload = async (e) => {
//         try {
//           const arrayBuffer = e.target.result
//           const result = await mammoth.extractRawText({ arrayBuffer })
//           const content = result.value // Extracted text content
//           const newId = uuidV4()
//           const socket = io('http://localhost:3001')

//           // Create a new document with the extracted content
//           socket.emit('create-document', {
//             id: newId,
//             title: file.name,
//             data: { ops: [{ insert: content }] }
//           })

//           // Navigate to the new document
//           navigate(`/documents/${newId}`)
//         } catch (error) {
//           console.error('Error processing .docx file:', error)
//           alert('Error processing .docx file. Please try again.')
//         }
//       }
//       reader.readAsArrayBuffer(file)
//     } else {
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         try {
//           const content = e.target.result
//           const newId = uuidV4()
//           const socket = io('http://localhost:3001')

//           // Create a new document with the file content
//           socket.emit('create-document', {
//             id: newId,
//             title: file.name,
//             data: { ops: [{ insert: content }] }
//           })

//           // Navigate to the new document
//           navigate(`/documents/${newId}`)
//         } catch (error) {
//           console.error('Error reading file:', error)
//           alert('Error reading file. Please try again.')
//         }
//       }
//       reader.readAsText(file)
//     }
//   }

//   const handleDelete = async (docId) => {
//     if (window.confirm('Are you sure you want to delete this document?')) {
//       const socket = io('http://localhost:3001')
//       socket.emit('delete-document', docId)
//     }
//   }

//   const startEditing = (doc) => {
//     setEditingTitle(doc._id)
//     setNewTitle(doc.title || '')
//   }

//   const saveTitle = (docId) => {
//     const socket = io('http://localhost:3001')
//     socket.emit('update-title', { docId, title: newTitle })
//     setEditingTitle(null)
//   }

//   return (
//     <div className="document-list">
//       <div className="header">
//         <h1>LiveDoc</h1>
//         <div className="header-buttons">
//           <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
//             Open File
//           </button>
//           <button className="new-doc-btn" onClick={createNewDocument}>
//             New Document
//           </button>
//         </div>
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handleFileUpload}
//           style={{ display: 'none' }}
//           accept=".txt,.md,.doc,.docx"
//         />
//       </div>
      
//       {/* <div className="documents">
//         <h2>Your Documents</h2>
//         {documents.length === 0 ? (
//           <p>No documents yet. Create a new one!</p>
//         ) : (
//           <ul>
//             {documents.map((doc) => (
//               <li key={doc._id}>
//                 <div className="document-item">
//                   {editingTitle === doc._id ? (
//                     <div className="title-edit">
//                       <input
//                         type="text"
//                         value={newTitle}
//                         onChange={(e) => setNewTitle(e.target.value)}
//                         onKeyPress={(e) => e.key === 'Enter' && saveTitle(doc._id)}
//                         autoFocus
//                       />
//                       <button onClick={() => saveTitle(doc._id)}>Save</button>
//                       <button onClick={() => setEditingTitle(null)}>Cancel</button>
//                     </div>
//                   ) : (
//                     <div className="document-content" onClick={() => navigate(`/documents/${doc._id}`)}>
//                       <span className="document-title">{doc.title || 'Untitled Document'}</span>
//                       <span className="document-date">
//                         {new Date(doc.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>
//                   )}
//                   <div className="document-actions">
//                     <button className="edit-btn" onClick={(e) => { e.stopPropagation(); startEditing(doc) }}>Edit Title</button>
//                     <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(doc._id) }}>Delete</button>
//                   </div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div> */}
//     </div>
//   )
// }