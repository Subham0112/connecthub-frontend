import { useContext, useState } from 'react'
import { BsEye,BsEyeSlash } from 'react-icons/bs';
import axios from "axios"
import type { AlertData } from '../components/Alert';
import {UserDataContext} from "../context/userContext";
import AuthLayout from '../components/AuthLayout';

interface ChangePassword{
    password:string;
    changePassword:string;
}
const ChangePasswordPage = ({setAlert}:{ setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {


    const [changeData,setChangeData]=useState<ChangePassword>({
        password: "",
        changePassword: ""
    })
    const [showPassword,setShowPassword]=useState<boolean>(false)
    const [showChangePassword,setShowChangePassword]=useState<boolean>(false)
    const [loading,setLoading]=useState<boolean>(false)
    const context=useContext(UserDataContext);
    if(!context) return null
    const {user} = context

    const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
        setChangeData({
            ...changeData,
            [e.target.name]:e.target.value
        })
    }

    const handleChangePassword=async ()=>{
        if(loading) return
        setLoading(true)
        try{
            const updateData={
                email:user.email,
                password:changeData.password,
                changePassword:changeData.changePassword
            }
            await axios.patch(`${import.meta.env.VITE_BACKEND_API}/change-password`,updateData,{
                withCredentials:true
            });
            setAlert({ type: 'success', title: 'Password changed', message: 'Your password was updated successfully.' })
            setChangeData({
                password: "",
                changePassword: ""

            })
        }catch(err){
    if(axios.isAxiosError(err)){
      const data = err.response?.data
      if(data?.message){
        setAlert({
          type:"error",
          title:"Error Password Change",
          message:data.message
        })
        console.error("Error Changing Password:",data.message)
      }
  }else{
    setAlert({
      type:"error",
      title:"Error Changing Password",
      message:"Error Changing Password"
    })
  }
        }finally{
            setLoading(false)
        }
    }
  return (
    <AuthLayout
      eyebrow="Security"
      title="Change your password"
      subtitle="Keep your account locked down — update it anytime."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="oldPassword" className="label-luxe">Current password</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ivory-300 bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
            <input
              id="oldPassword"
              onChange={handleChange}
              value={changeData.password}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your current password"
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
          <label htmlFor="newPassword" className="label-luxe">New password</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ivory-300 bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:border-sage-600 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-sage-200/70">
            <input
              id="newPassword"
              onChange={handleChange}
              value={changeData.changePassword}
              name="changePassword"
              type={showChangePassword ? "text" : "password"}
              placeholder="Choose a new password"
              className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
            />
            <button
              type="button"
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="text-ink-300 transition-colors hover:text-ink-800 focus:outline-none shrink-0"
              aria-label={showChangePassword ? 'Hide password' : 'Show password'}
            >
              {showChangePassword ? <BsEye /> : <BsEyeSlash />}
            </button>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading || !changeData.password || !changeData.changePassword}
          aria-busy={loading}
          className="btn-primary w-full py-3 text-[13.5px]"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </AuthLayout>
  )
}

export default ChangePasswordPage