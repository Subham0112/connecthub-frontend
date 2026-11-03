import { useState, useEffect, useContext } from 'react'
import type { ChangeEvent } from 'react'
import { UserDataContext } from '../context/userContext';
import type { AlertData } from '../components/Alert';
import { BsEye, BsEyeSlash, BsEnvelope, BsLock } from 'react-icons/bs';
import axios from "axios"
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';


interface UserData {
    email: string;
    password: string;
}

interface ZodIssue {
    path: string[];
    message: string;
}

const Login = ({setAlert}:{ setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {

const [usersData, setUsersData] = useState<UserData>({
    email: "",
    password: ""
})  
const [showPassword,setShowPassword]=useState<boolean>(false);
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
const [loading, setLoading] = useState<boolean>(false)

const navigate=useNavigate();

const context=useContext(UserDataContext);

useEffect(()=>{
   if (!context) return;  
    const { loading, user } = context;
    
    if(!loading && user.role){
        if (user.role === "user") {
            navigate("/dashboard", { replace: true })
        } else if (user.role === "admin") {
            navigate("/admin/dashboard", { replace: true })
        } else if (user.role === "sudoadmin") {
            navigate("/sudoadmin/dashboard", { replace: true })
        }
    }
},[context, navigate])

if(!context){
    return null
}


const handleChange=(e:ChangeEvent<HTMLInputElement>)=>{
    setUsersData({
        ...usersData,
        [e.target.name]: e.target.value
    })

    if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: "" })
        }
}

const handleSubmit =async ()=>{
    if (loading) return
    setLoading(true)
    setFieldErrors({})
    try{
        const res=await axios.post(`${import.meta.env.VITE_BACKEND_API}/login`,usersData,{
            withCredentials:true
        });
        const role = res.data.user.role;
        if (role !== "user") {
            await axios.post(`${import.meta.env.VITE_BACKEND_API}/logout`, {}, {
                withCredentials: true
            });
            setAlert({
                type: 'error',
                title: 'Invalid Credentials',
                message: 'Please Enter Correct Email and Password'
            });
            navigate("/login", { replace: true });
            return;
        }
        await context?.refreshUser();
        console.log("logged in successfully");
        navigate("/dashboard", { replace: true });
    }catch(err){
             if (axios.isAxiosError(err)) {
                const data = err.response?.data

                if (data?.errors) {
                    const mapped: Record<string, string> = {}
                    data.errors.forEach((e: ZodIssue) => {
                        if (e.path?.[0]) {
                            mapped[e.path[0]] = e.message
                        }
                    })
                    setFieldErrors(mapped)

                } else if (data?.message) {
                    
                    setAlert({ type: 'error', title: 'Login failed', message: data.message })
                }

            } else {
                setAlert({ type: 'error', title: 'Login failed', message: "Login failed." })
            }
         } finally {
            setLoading(false)
         }
}
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to ConnectHub"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="label-luxe">Email</label>
          <div className={`flex items-center gap-2.5 rounded-xl border bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:bg-white focus-within:ring-[3px] ${fieldErrors.email ? 'border-clay-500 focus-within:ring-clay-100' : 'border-ivory-300 focus-within:border-sage-600 focus-within:ring-sage-200/70'}`}>
            <BsEnvelope className="text-ink-300 shrink-0" />
            <input
              id="email"
              onChange={handleChange}
              name="email"
              value={usersData.email}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
            />
          </div>
          {fieldErrors.email && <p className="text-xs font-medium text-clay-600">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label-luxe mb-0">Password</label>
            <a
              href="/forgot-password"
              className="text-[12px] font-semibold text-sage-700 transition-colors hover:text-sage-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className={`flex items-center gap-2.5 rounded-xl border bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:bg-white focus-within:ring-[3px] ${fieldErrors.password ? 'border-clay-500 focus-within:ring-clay-100' : 'border-ivory-300 focus-within:border-sage-600 focus-within:ring-sage-200/70'}`}>
            <BsLock className="text-ink-300 shrink-0" />
            <input
              id="password"
              onChange={handleChange}
              name="password"
              value={usersData.password}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
          {fieldErrors.password && <p className="text-xs font-medium text-clay-600">{fieldErrors.password}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full py-3 text-[13.5px]"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Logging in…" : "Log in"}
        </button>
      </div>

      <div className="mt-7 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-300">
        <div className="h-px flex-1 bg-ivory-300" />
        <span>new to the circle?</span>
        <div className="h-px flex-1 bg-ivory-300" />
      </div>

      <div className="mt-5 text-center">
        <a
          href="/register"
          className="text-[13.5px] font-semibold text-sage-700 transition-colors hover:text-sage-600 hover:underline"
        >
          Create an account
        </a>
      </div>
    </AuthLayout>
  )
}

export default Login