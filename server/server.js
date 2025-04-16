import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Document from './Document.js'

await mongoose.connect('mongodb://127.0.0.1/live-doc')

const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    },
})

const defaultValue = ""

// Store user sessions with email and username
const userSessions = new Map() // socketId -> { email, username }

// Track users in each document room
const documentRooms = new Map() // documentId -> Set of { socketId, email, username }

io.on("connection", socket => {
    // Handle user identification
    socket.on('identify-user', ({ email, username }) => {
        userSessions.set(socket.id, { email, username })
    })

    // Handle document listing
    socket.on('get-documents', async () => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const documents = await Document.find({
            $or: [
                { owner: userInfo.email },
                { 'collaborators.email': userInfo.email }
            ]
        }).sort({ createdAt: -1 })
        socket.emit('document-list', documents)
    })

    // Handle document creation from file
    socket.on('create-document', async ({ id, title, data }) => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        await Document.create({
            _id: id,
            title: title || 'Untitled Document',
            data: data || defaultValue,
            createdAt: new Date(),
            owner: userInfo.email,
            collaborators: []
        })
        
        updateAndBroadcastDocuments(userInfo.email)
    });

    socket.on('update-document', async ({ id, data }) => {
        await Document.updateOne({ _id: id }, {
            $set: { data: data }
        });
    });

    // Handle document deletion
    socket.on('delete-document', async (docId) => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const document = await Document.findById(docId)
        if (document && document.owner === userInfo.email) {
            await Document.findByIdAndDelete(docId)
            updateAndBroadcastDocuments(userInfo.email)
        }
    })

    // Handle title updates
    socket.on('update-title', async ({ docId, title }) => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const document = await Document.findById(docId)
        if (document && (document.owner === userInfo.email || 
                         document.collaborators.some(c => c.email === userInfo.email && c.permission === 'edit'))) {
            await Document.findByIdAndUpdate(docId, { title })
            updateAndBroadcastDocuments(userInfo.email)
        }
    })

    // Handle adding collaborators
    socket.on('add-collaborator', async ({ docId, email, permission }) => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const document = await Document.findById(docId)
        if (document && document.owner === userInfo.email) {
            const collaborator = document.collaborators.find(c => c.email === email)
            if (collaborator) {
                collaborator.permission = permission
            } else {
                document.collaborators.push({ email, permission })
            }
            await document.save()
            updateAndBroadcastDocuments(userInfo.email)
        }
    })

    // Handle removing collaborators
    socket.on('remove-collaborator', async ({ docId, email }) => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const document = await Document.findById(docId)
        if (document && document.owner === userInfo.email) {
            document.collaborators = document.collaborators.filter(c => c.email !== email)
            await document.save()
            updateAndBroadcastDocuments(userInfo.email)
        }
    })

    socket.on('get-document', async documentId => {
        const userInfo = userSessions.get(socket.id)
        if (!userInfo) return
        
        const document = await findOrCreateDocument(documentId, userInfo.email)
        
        // Join the socket room for this document
        socket.join(documentId)
        
        // Add user to document room
        if (!documentRooms.has(documentId)) {
            documentRooms.set(documentId, new Set())
        }
        
        const roomUsers = documentRooms.get(documentId)
        roomUsers.add({
            socketId: socket.id,
            email: userInfo.email,
            username: userInfo.username
        })
        
        // Notify others that user joined
        socket.to(documentId).emit("user-joined", {
            username: userInfo.username,
            email: userInfo.email
        })
        
        // Send updated user list to everyone in the room
        const connectedUsers = Array.from(roomUsers).map(user => ({
            username: user.username,
            email: user.email
        }))
        
        io.to(documentId).emit("connected-users", connectedUsers)
        
        const isOwner = document.owner === userInfo.email
        const collaborator = document.collaborators.find(c => c.email === userInfo.email)
        const permissions = isOwner ? ['edit'] : (collaborator ? [collaborator.permission] : ['edit'])
        
        socket.emit("load-document", {
            document,
            isOwner,
            permissions,
            collaborators: document.collaborators,
            connectedUsers
        })

        socket.on('send-changes', delta => {
            if (permissions.includes('edit')) {
                socket.broadcast.to(documentId).emit("receive-changes", delta)
            }
        })

        socket.on("save-document", async data => {
            if (permissions.includes('edit')) {
                await Document.findByIdAndUpdate(documentId, { data })
                updateAndBroadcastDocuments(userInfo.email)
            }
        })
        
        // Handle leaving the document
        const handleLeaveDocument = async () => {
            if (documentRooms.has(documentId)) {
                const roomUsers = documentRooms.get(documentId)
                
                // Find and remove the user
                const userToRemove = Array.from(roomUsers).find(user => user.socketId === socket.id)
                
                if (userToRemove) {
                    roomUsers.delete(userToRemove)
                    
                    // If room is empty, clean up
                    if (roomUsers.size === 0) {
                        documentRooms.delete(documentId)
                    } else {
                        // Notify others that user left
                        socket.to(documentId).emit("user-left", {
                            username: userToRemove.username,
                            email: userToRemove.email
                        })
                        
                        // Send updated user list
                        const updatedUsers = Array.from(roomUsers).map(user => ({
                            username: user.username,
                            email: user.email
                        }))
                        
                        io.to(documentId).emit("connected-users", updatedUsers)
                    }
                }
            }
        }
        
        socket.on('leave-document', handleLeaveDocument)
        
        // Also handle disconnection while in document
        socket.on('disconnect', handleLeaveDocument)
    })

    // Clean up on disconnect
    socket.on('disconnect', () => {
        userSessions.delete(socket.id)
    })
})

// Helper function to update and broadcast document list
async function updateAndBroadcastDocuments(userEmail) {
    const documents = await Document.find({
        $or: [
            { owner: userEmail },
            { 'collaborators.email': userEmail }
        ]
    }).sort({ createdAt: -1 })
    
    // Find all socket ids for this user
    const userSocketIds = Array.from(userSessions.entries())
        .filter(([_, info]) => info.email === userEmail)
        .map(([socketId, _]) => socketId)
    
    // Send updated documents to all connected clients for this user
    userSocketIds.forEach(socketId => {
        io.to(socketId).emit('document-list', documents)
    })
}

async function findOrCreateDocument(id, ownerEmail) {
    if (id == null) return
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({
        _id: id,
        data: defaultValue,
        title: 'Untitled Document',
        owner: ownerEmail,
        collaborators: []
    })
}

httpServer.listen(3001, () => {
    console.log('Server is listening on port 3001')
})