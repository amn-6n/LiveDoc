import { Schema, model } from 'mongoose'

const collaboratorSchema = new Schema({
    email: String,
    permission: String
})

const documentSchema = new Schema({
    _id: String,
    title: String,
    data: Object,
    createdAt: { type: Date, default: Date.now },
    owner: String,
    collaborators: [collaboratorSchema]
})

const Document = model("Document", documentSchema)

export default Document