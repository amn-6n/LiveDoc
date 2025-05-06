# LiveDoc

LiveDoc is a collaborative document editing platform that allows multiple users to create, edit, and share documents in real-time. It features user authentication, document sharing, and live collaboration using WebSockets.

---

## 🚀 Features

* **User Authentication**: Secure user registration and login using JWT.
* **Real-Time Collaboration**: Edit documents with multiple users simultaneously.
* **Document Management**: Create, update, delete, and share documents.
* **File Upload**: Import `.docx` and `.txt` files into the editor.
* **Export Documents**: Save documents as `.docx` files.
* **Notifications**: Real-time notifications for user join/leave events.

---

## 🛠 Tech Stack

### Backend

* **Node.js**: Server-side runtime
* **Express.js**: Web framework for building RESTful APIs
* **MongoDB**: Database for storing user and document data
* **Socket.IO**: Real-time communication for collaborative editing
* **Mongoose**: ODM for MongoDB
* **JWT**: Authentication and authorization
* **Bcrypt**: Password hashing

### Frontend

* **React**: Frontend library for building user interfaces
* **Quill.js**: Rich text editor for document editing
* **Socket.IO Client**: Real-time communication with the server
* **React Router**: Routing for navigation
* **React Hot Toast**: Notifications
* **Docx**: Export documents to `.docx` format
* **Mammoth.js**: Import `.docx` files

---

## ⚙️ Installation


### 🖥️ Backend Setup

Create a `.env` file in the `server/` directory and add the following:

```ini
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_uri
```

Start the server:

```bash
npm start
```

> Server runs at **[http://localhost:3001](http://localhost:3001)**

---

### 🌐 Frontend Setup

```bash
cd client
npm install
npm run dev
```

> Client runs at **[http://localhost:5173](http://localhost:5173)**

---

## 💡 Usage

1. **Register**: Go to `/register` to create a new account.
2. **Login**: Log in at `/`.
3. **Join/Create Room**: Visit `/join` to start or join a document.
4. **Edit**: Use the rich text editor for real-time collaboration.
5. **Share**: Generate a document link to collaborate.
6. **Export**: Save documents as `.docx` files.

---

## 📁 Folder Structure

### Backend (`server/`)

* `server.js` – Main server file
* `route.js` – API routes
* `user.js` – Mongoose schema for users
* `Document.js` – Mongoose schema for documents
* `middleware.js` – JWT middleware

### Frontend (`client/src/`)

* `TextEditor.jsx` – Main editor component
* `RoomForm.jsx` – Form to create/join rooms
* `Auth/` – Login and register components
* `styles/` – Custom styles

---

## 🔌 API Endpoints

### User Routes (REST)

* `POST /api/v1/users/register` – Register user
* `POST /api/v1/users/login` – Login
* `GET /api/v1/users/myInfo` – Get user info (JWT required)

### Document Routes (WebSocket Events)

* `get-documents` – Retrieve user documents
* `create-document` – Create new document
* `update-document` – Update content
* `delete-document` – Delete document
* `add-collaborator` – Add collaborator

---

## 🔮 Future Enhancements

* Real-time cursor tracking
* Document version control
* Advanced permission levels
* More supported file formats

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with ❤️ by **Aman Singh**.


