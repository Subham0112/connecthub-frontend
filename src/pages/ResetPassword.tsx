import { useState } from 'react';
import axios from 'axios';
import { BsEye,BsEyeSlash } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import type { AlertData } from '../components/Alert';
import AuthLayout from '../components/AuthLayout';


const ResetPassword = ({setAlert}:{ setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {

    const [newPassword,setNewPassword]=useState<string>('');
    const [confirmPassword,setConfirmPassword]=useState<string>('')
    const [showPassword,setShowPassword]=useState<boolean>(false);
    const [showConfirmPassword,setShowConfirmPassword]=useState<boolean>(false);
    const [loading,setLoading]=useState<boolean>(false);

    const navigate=useNavigate();
    

    const handleSubmit=async()=>{
      if(loading) return
      if(newPassword!==confirmPassword){
        setAlert({ type: 'error', title: 'Password mismatch', message: 'New password and confirmation must match.' })
        return
      }
      const email=localStorage.getItem("email")
      const resetData={
        newPassword,
        email
      }
      setLoading(true)
      try{
        const res = await axios.patch(`${import.meta.env.VITE_BACKEND_API}/reset-password`,resetData)
        setAlert({ type: 'success', title: 'Password reset', message: res.data.message })
        navigate("/login")
      }catch(err){
          if(axios.isAxiosError(err)){
      const data = err.response?.data
      if(data?.message){
        setAlert({
          type:"error",
          title:"Error Resetting Password",
          message:data.message
        })
        console.error("Failed to Reset Password",data.message)
      }
  }else{
    setAlert({
      type:"error",
      title:"Error Resetting Password",
      message:"Failed to Reset Password"
    })
  }
      }finally{
        setLoading(false)
      }
    }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Choose something fresh — you'll use it to sign in from now on."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="label-luxe">New password</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ivory-300 bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
            <input
              id="newPassword"
              onChange={(e) => setNewPassword(e.target.value)}
              name="newPassword"
              value={newPassword}
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ink-300 transition-colors hover:text-ink-800 focus:outline-none shrink-0"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <BsEye /> : <BsEyeSlash />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="label-luxe">Confirm password</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ivory-300 bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
            <input
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              name="confirmPassword"
              value={confirmPassword}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat the new password"
              className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-ink-300 transition-colors hover:text-ink-800 focus:outline-none shrink-0"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <BsEye /> : <BsEyeSlash />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !newPassword || !confirmPassword}
          aria-busy={loading}
          className="btn-primary w-full py-3 text-[13.5px]"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Resetting…" : "Reset password"}
        </button>

        <button
          onClick={() => navigate("/login")}
          className="btn-ghost w-full py-2.5"
        >
          Cancel
        </button>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword