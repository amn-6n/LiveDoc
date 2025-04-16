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

// Store user sessions
const userSessions = new Map()

io.on("connection", socket => {
    // Handle user identification
    socket.on('identify-user', (email) => {
        userSessions.set(socket.id, email)
    })

    // Handle document listing
    socket.on('get-documents', async () => {
        const userEmail = userSessions.get(socket.id)
        const documents = await Document.find({
            $or: [
                { owner: userEmail },
                { 'collaborators.email': userEmail }
            ]
        }).sort({ createdAt: -1 })
        socket.emit('document-list', documents)
    })

    // Handle document creation from file
    socket.on('create-document', async ({ id, title, data }) => {
        const userEmail = userSessions.get(socket.id)
        await Document.create({
            _id: id,
            title: title,
            data: data,
            createdAt: new Date(),
            owner: userEmail,
            collaborators: []
        })
        const documents = await Document.find({
            $or: [
                { owner: userEmail },
                { 'collaborators.email': userEmail }
            ]
        }).sort({ createdAt: -1 })
        io.emit('document-list', documents)
    })

    // Handle document deletion
    socket.on('delete-document', async (docId) => {
        const userEmail = userSessions.get(socket.id)
        const document = await Document.findById(docId)
        if (document && document.owner === userEmail) {
            await Document.findByIdAndDelete(docId)
            const documents = await Document.find({
                $or: [
                    { owner: userEmail },
                    { 'collaborators.email': userEmail }
                ]
            }).sort({ createdAt: -1 })
            io.emit('document-list', documents)
        }
    })

    // Handle title updates
    socket.on('update-title', async ({ docId, title }) => {
        const userEmail = userSessions.get(socket.id)
        const document = await Document.findById(docId)
        if (document && document.owner === userEmail) {
            await Document.findByIdAndUpdate(docId, { title })
            const documents = await Document.find({
                $or: [
                    { owner: userEmail },
                    { 'collaborators.email': userEmail }
                ]
            }).sort({ createdAt: -1 })
            io.emit('document-list', documents)
        }
    })

    // Handle adding collaborators
    socket.on('add-collaborator', async ({ docId, email, permission }) => {
        const userEmail = userSessions.get(socket.id)
        const document = await Document.findById(docId)
        if (document && document.owner === userEmail) {
            const collaborator = document.collaborators.find(c => c.email === email)
            if (collaborator) {
                collaborator.permission = permission
            } else {
                document.collaborators.push({ email, permission })
            }
            await document.save()
            const documents = await Document.find({
                $or: [
                    { owner: userEmail },
                    { 'collaborators.email': userEmail }
                ]
            }).sort({ createdAt: -1 })
            io.emit('document-list', documents)
        }
    })

    // Handle removing collaborators
    socket.on('remove-collaborator', async ({ docId, email }) => {
        const userEmail = userSessions.get(socket.id)
        const document = await Document.findById(docId)
        if (document && document.owner === userEmail) {
            document.collaborators = document.collaborators.filter(c => c.email !== email)
            await document.save()
            const documents = await Document.find({
                $or: [
                    { owner: userEmail },
                    { 'collaborators.email': userEmail }
                ]
            }).sort({ createdAt: -1 })
            io.emit('document-list', documents)
        }
    })

    socket.on('get-document', async documentId => {
        const userEmail = userSessions.get(socket.id)
        const document = await findOrCreateDocument(documentId, userEmail)
        socket.join(documentId)
        
        const isOwner = document.owner === userEmail
        const collaborator = document.collaborators.find(c => c.email === userEmail)
        const permissions = isOwner ? ['edit'] : (collaborator ? [collaborator.permission] : ['read'])
        
        socket.emit("load-document", {
            document,
            isOwner,
            permissions,
            collaborators: document.collaborators
        })

        socket.on('send-changes', delta => {
            if (permissions.includes('edit')) {
                socket.broadcast.to(documentId).emit("receive-changes", delta)
            }
        })

        socket.on("save-document", async data => {
            if (permissions.includes('edit')) {
                await Document.findByIdAndUpdate(documentId, { data })
                const documents = await Document.find({
                    $or: [
                        { owner: userEmail },
                        { 'collaborators.email': userEmail }
                    ]
                }).sort({ createdAt: -1 })
                io.emit('document-list', documents)
            }
        })
    })

    // Clean up on disconnect
    socket.on('disconnect', () => {
        userSessions.delete(socket.id)
    })
})

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