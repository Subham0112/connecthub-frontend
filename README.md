# AuthFrontend

This is the React client for the AuthFull platform. It gives users a browser-based interface for login, registration, profile management, social activity, friendship flows, role-based dashboards, and real-time chats.

## What this frontend does

The frontend is responsible for the user experience of the entire platform. It connects to the backend API, stores the current user session, handles auth refreshes, and coordinates role-based access for:

- regular users
- admins
- super admins

It brings together the social experience through pages for authentication, dashboard, profile, posts, friend requests, messages, and admin functions.

## System flow from the UI side

### 1. App startup and user session

When the app loads, the app root calls the user context provider. That provider immediately reads the current user profile from /profile.

The frontend stores that user in shared context and exposes:

- user
- setUser
- loading
- refreshUser
- sessionExpire

If the profile request fails, the app clears the local user state and routes the user back to login.

### 2. Protected routes and access control

Routes are gated by ProtectedRoute. The component checks whether the user has a valid role and then allows access only to the matching pages.

Examples from the app:

- /dashboard is allowed only for users with role "user"
- /admin/dashboard is allowed only for role "admin"
- /sudoadmin/dashboard is allowed only for role "sudoadmin"
- /change-password is available to user, admin, and super admin

This keeps the UI aligned with the backend role checks.

### 3. Axios and token refresh handling

The shared API client is defined in src/lib/axiosInstance.ts.

Important behavior:

- it uses the backend URL from VITE_BACKEND_API
- it sends credentials with every request
- it automatically watches for 401 responses
- when the access token expires, it calls /refresh-token and retries the original request
- if refresh fails, it triggers logout state in the app

This makes the backend session experience smoother without repeating manual login steps.

### 4. Real-time socket integration

The frontend includes a shared socket manager in src/lib/socket.ts.

The app creates a single socket per tab and joins a private room for the logged-in user, using names such as user_<id>. That way:

- friend updates can be pushed only to that user
- chat messages can arrive immediately
- typing indicators can be shown live
- unread-count updates can be reflected without polling

Socket events used by the frontend include:

- join
- receive_message
- user_typing
- user_stop_typing
- messages_read
- total_unread_count

## Routing overview

The main app routes are configured in src/App.tsx:

- / -> redirects to /login
- /login
- /register
- /admin/login
- /admin/register
- /dashboard
- /homepage
- /users/:otherUserId
- /messages
- /messages/:userId
- /change-password
- /forgot-password
- /otp-page
- /reset-password
- /admin/dashboard
- /sudoadmin/dashboard

## App structure

```text
authfrontend/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── UserData.ts
│   ├── assets/
│   ├── components/
│   │   ├── Alert.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── CommentModal.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── EditModal.tsx
│   │   ├── FriendList.tsx
│   │   ├── FriendRequest.tsx
│   │   ├── LikeModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── PostModal.tsx
│   │   ├── ProfileModal.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RequestModal.tsx
│   │   └── SentRequestList.tsx
│   ├── context/
│   │   └── userContext.tsx
│   ├── lib/
│   │   ├── axiosInstance.ts
│   │   └── socket.ts
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminRegister.tsx
│   │   ├── ChangePassword.tsx
│   │   ├── ChatPage.tsx
│   │   ├── forgotPassword.tsx
│   │   ├── HomePage.tsx
│   │   ├── login.tsx
│   │   ├── Message.tsx
│   │   ├── otpPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── register.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── SudoDashboard.tsx
│   │   └── UserDashboard.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## Main user journeys

### Authentication journey

A user starts at /login or /register. After successful auth, the backend sets cookies and returns authenticated user data. The frontend stores that in the context and redirects the user to the correct dashboard or homepage depending on role.

### Profile and feed journey

The user can:

- update their profile image
- view their own or other user profiles
- create posts
- browse the social feed
- like and comment on posts
- edit or delete their own content

### Friend journey

Users can:

- send friend requests
- view pending requests
- accept or reject requests
- see friends list
- remove or cancel requests

### Messaging journey

Users can open /messages and choose another user to chat with. The page connects to the backend chat APIs and also subscribes to live message updates through Socket.IO.

### Admin flow

Admins and super admins get separate pages and role checks. The UI enforces that only the correct role can access those screens.

## Environment setup

Create a .env file in the frontend root:

```env
VITE_BACKEND_API=http://localhost:3000
```

This variable tells the app where the Express backend is running.

## Running the frontend

Install dependencies:

```bash
cd authfrontend
npm install
```

Start the app in development mode:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
```

The compiled output is generated inside the dist folder.

## Developer notes

- The app uses React Router for navigation and route guards
- Auth context is central to the app and drives user state across pages
- The backend access token is refreshed automatically in the background
- Real-time updates depend on a stable Socket.IO connection
- Styling uses Tailwind, which keeps the UI modular and fast to build

## Recommended understanding for contributors

To understand the system quickly, read in this order:

1. backend: src/app.ts
2. backend: src/routes/*
3. backend: src/controllers/*
4. frontend: src/lib/axiosInstance.ts
5. frontend: src/context/userContext.tsx
6. frontend: src/App.tsx
7. frontend: src/lib/socket.ts

That path shows the full data flow: browser request -> API call -> auth middleware -> database -> real-time socket updates -> UI refresh.

This frontend is the presentation layer of the same platform described in the backend documentation. Together, they form a complete user-driven social and authentication system.
