# 🧠 Whiteboard Backend

An Express.js backend server for the collaborative Whiteboard app. It provides secure RESTful APIs for user authentication, board creation, sharing, canvas saving to AWS S3, and more.

---

## 🚀 Features

- 🔐 User Registration, Login, Logout with JWT Auth
- 🎨 Board creation, editing, sharing with permission control
- 👥 Share boards via email with `view` or `edit` permissions
- 🧾 Canvas saving as image uploads to **AWS S3**
- 🧠 MongoDB-based persistent storage
- 🍪 Secure HTTP-only cookies for auth sessions
- 📦 REST API ready to be consumed by frontend

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** with Mongoose
- **JWT** (JSON Web Token) for authentication
- **AWS S3** for canvas storage
- **Cookie-Parser** for HTTP-only cookie handling
- **CORS** and Helmet for security


---

## ⚙️ Setup

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/whiteboard-backend.git
cd whiteboard-backend
```
### 2. Install Dependencies

```
npm install
```

### 3. Create .env file
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region
CLIENT_URL=https://your-frontend-url.com
```

### 4.Start the Server
```
npm run dev
```
By default, it runs on ```http://localhost:5000```

---

## 🛡️ Auth Flow
- JWT token is issued on login and stored in an HTTP-only cookie
- Subsequent authenticated requests use that cookie automatically
- Middleware ```auth.js``` checks and decodes token for protected routes

---

## 📤 Upload to AWS S3
- Boards are saved as images (PNG) and uploaded to the specified AWS S3 bucket
- The S3 URL is stored in the board's MongoDB record as ```.data```

---

## 🔄 API Endpoints (Sample)

| Method | Route                        | Description                |
|--------|------------------------------|----------------------------|
| POST   | `/api/auth/register`         | Register user              |
| POST   | `/api/auth/login`            | Login and set cookie       |
| GET    | `/api/auth/me`               | Get current user from JWT  |
| POST   | `/api/boards/createBoard`    | Create a new board         |
| POST   | `/api/boards/:id/share`      | Share board by email       |
| POST   | `/api/boards/:id/upload`     | Upload canvas to S3        |

---

## 🧪 Testing
You can test the API with:
- Postman
- Insomnia
- Frontend client (whiteboard)

---

## 📄 License
This project is open-sourced under the MIT License.

---

## 🧑‍💻 Built By

Samyak Shah – Passionate about full-stack development, graphics systems, and real-time apps.

<img src="https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg" width='15px'/> [LinkedIn](https://www.linkedin.com/in/samyakkshah/)
