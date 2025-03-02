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

io.on("connection", socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document.data)

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })
})

async function findOrCreateDocument(id) {
    if (id == null) return
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({_id: id, data: defaultValue})
}

httpServer.listen(3001, () => {
    console.log('Server is listening on port 3001')
})