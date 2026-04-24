# 🚀 Taskora – Full Stack Task Management System

Taskora is a modern full-stack task management platform designed for teams and organizations to manage tasks, members, activity logs, and workflow efficiently.

Built with a professional dashboard UI, secure authentication system, role-based access, and scalable backend architecture.

---

## ✨ Features

### 🔐 Authentication & Authorization

* Secure Login System
* JWT Authentication
* Protected Routes
* Role-Based Access Control
* Owner / Admin / Member Roles

### 📋 Task Management

* Create Tasks
* Update Tasks
* Delete Tasks
* Restore Deleted Tasks
* Trash Management
* Task Status Tracking
* Assigned Members

### 👥 Team Management

* Members Dashboard
* Create / Manage Members
* Role Management
* Owner Controls

### 📜 Activity Logs

* Task Created Logs
* Task Updated Logs
* Deleted / Restored Logs
* Member Added Logs
* Role Updated Logs

### 🎨 Modern UI

* Premium Dashboard Design
* Responsive Layout
* Sidebar Navigation
* Search / Filter Interface
* Smooth User Experience

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### Backend

* NestJS
* TypeScript
* JWT Authentication
* REST API

### Database

* PostgreSQL
* Prisma ORM

### DevOps

* Docker
* GitHub

---

## 📂 Project Structure

```text
task-management-system/
├── apps/
│   ├── web        # Frontend (Next.js)
│   └── api        # Backend (NestJS)
│
├── packages/
│   └── db         # Prisma / Shared DB package
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/taskora.git
cd taskora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env` files where required.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskora
JWT_SECRET=your_secret_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ▶️ Run Locally

### Frontend

```bash
cd apps/web
npm run dev
```

Runs at:

```text
http://localhost:3000
```

### Backend

```bash
cd apps/api
npm run start:dev
```

Runs at:

```text
http://localhost:5000
```

---

## 🐳 Run With Docker

```bash
docker compose up --build
```

---

## 📸 Screenshots

* Login Page
* Dashboard
* Tasks Page
* Trash Page
* Members Page
* Activity Logs



---

## 🌟 Future Enhancements

* Email Notifications
* Drag & Drop Tasks
* Dark Mode
* Team Chat
* Calendar View
* File Uploads
* Analytics Dashboard

---

## 👨‍💻 Developed By

**Tejesri Ram**

---

## 📄 License

This project is open-source and available for learning and portfolio use.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub.
