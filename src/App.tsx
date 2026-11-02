import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/register'
import ProtectectedRoute from './components/ProtectedRoute'

import UserDashboard from './pages/UserDashboard'

import ForgotPassword from './pages/forgotPassword'
import ResetPassword from './pages/ResetPassword'
import Alert from './components/Alert'
import type { AlertData } from './components/Alert'
import OTPPage from './pages/otpPage'
import ChangePasswordPage from './pages/ChangePassword'
import { useState } from 'react'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import Message from './pages/Message'
import ChatPage from './pages/ChatPage'


const App = () => {
  const [alert,setAlert]=useState<AlertData | null>(null)
  
  return (
    <>
 {alert && <Alert {...alert} onClose={()=>{
    setAlert(null)
 }} />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login setAlert={setAlert} />} />
        <Route path="/register" element={<Register setAlert={setAlert} />} />
       
    

         <Route path="/dashboard" element={
          <ProtectectedRoute allowedRoles={["user"]} redirectTo="/login">
            <UserDashboard setAlert={setAlert} />
          </ProtectectedRoute>
        } />
        <Route path="/homepage" element={
          <ProtectectedRoute allowedRoles={["user"]} redirectTo='/login'>
            <HomePage setAlert={setAlert} />
          </ProtectectedRoute>
        } />
        <Route path="/users/:otherUserId" element={
          <ProtectectedRoute allowedRoles={["user"]} redirectTo='/login'>
            <ProfilePage setAlert={setAlert} />
          </ProtectectedRoute>
        }/>
        <Route path="/change-password" element={
          <ProtectectedRoute allowedRoles={["user","admin","sudoadmin"]} redirectTo="/login">
            <ChangePasswordPage setAlert={setAlert} />
          </ProtectectedRoute>
        } />
          <Route path="/messages" element={
          <ProtectectedRoute allowedRoles={["user"]} redirectTo="/login">
            <Message setAlert={setAlert} />
          </ProtectectedRoute>
        } />
         <Route path="/messages/:userId" element={
          <ProtectectedRoute allowedRoles={["user"]} redirectTo="/login">
            <ChatPage setAlert={setAlert} />
          </ProtectectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword setAlert={setAlert} />} />
        <Route path="/otp-page" element={<OTPPage setAlert={setAlert}  />} />
        <Route path='/reset-password' element={<ResetPassword setAlert={setAlert}/>} />
      </Routes>

      </>
  )
}

export default App