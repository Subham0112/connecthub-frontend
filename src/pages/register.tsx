import { useState, useContext } from 'react'
import { BsEye, BsEyeSlash, BsPerson, BsEnvelope, BsLock } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import axios from "axios"
import type { AlertData } from '../components/Alert';
import { UserDataContext } from '../context/userContext';
import AuthLayout from '../components/AuthLayout';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: string;
}

interface ZodIssue {
    path: string[];
    message: string;
}

const Register = ({setAlert}:{ setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {

    const [userRegisterData, setRegisterData] = useState<RegisterData>({
        name: "",
        email: "",
        password: "",
        role: "user"
    })
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState<boolean>(false)
    const navigate=useNavigate()
    const context =useContext(UserDataContext)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterData({
            ...userRegisterData,
            [e.target.name]: e.target.value
        })
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: "" })
        }
    }
    if(!context) return null

    const {setUser}=context;

    const handleSubmit = async () => {
        if (loading) return
        setLoading(true)
        setFieldErrors({})

        try {
            const res= await axios.post(`${import.meta.env.VITE_BACKEND_API}/register`, userRegisterData,{
                withCredentials:true
            });
            setAlert({ type: 'success', title: 'Registered', message: 'Your account was created successfully.' })
            console.log(res.data.user);
            setUser(res.data.user)
            navigate("/dashboard")
            setRegisterData({ name: "", email: "", password: "", role: "user" })

        } catch (err) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data

                if (data?.errors) {
                    // Zod field errors — map array to { fieldName: message }
                    const mapped: Record<string, string> = {}
                    data.errors.forEach((e: ZodIssue) => {
                        if (e.path?.[0]) {
                            mapped[e.path[0]] = e.message
                        }
                    })
                    setFieldErrors(mapped)

                } else if (data?.message) {
                    // General error like "User already exists"
                    setAlert({ type: 'error', title: 'Register failed', message: data.message })
                }

            } else {
                setAlert({ type: 'error', title: 'Register failed', message: "Registration failed." })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
          eyebrow="Join the circle"
          title="Create your account"
          subtitle="A few seconds from now you'll have your own place to share."
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="label-luxe">Name</label>
              <div className={`flex items-center gap-2.5 rounded-xl border bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:bg-white focus-within:ring-[3px] ${fieldErrors.name ? 'border-clay-500 focus-within:ring-clay-100' : 'border-ivory-300 focus-within:border-sage-600 focus-within:ring-sage-200/70'}`}>
                <BsPerson className="text-ink-300 shrink-0" />
                <input
                  id="name"
                  onChange={handleChange}
                  value={userRegisterData.name}
                  name="name"
                  type="text"
                  placeholder="Your name"
                  className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
                />
              </div>
              {fieldErrors.name && <p className="text-xs font-medium text-clay-600">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="label-luxe">Email</label>
              <div className={`flex items-center gap-2.5 rounded-xl border bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:bg-white focus-within:ring-[3px] ${fieldErrors.email ? 'border-clay-500 focus-within:ring-clay-100' : 'border-ivory-300 focus-within:border-sage-600 focus-within:ring-sage-200/70'}`}>
                <BsEnvelope className="text-ink-300 shrink-0" />
                <input
                  id="email"
                  onChange={handleChange}
                  value={userRegisterData.email}
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-300"
                />
              </div>
              {fieldErrors.email && <p className="text-xs font-medium text-clay-600">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="label-luxe">Password</label>
              <div className={`flex items-center gap-2.5 rounded-xl border bg-ivory-100 px-3.5 py-2.5 transition-all duration-150 focus-within:bg-white focus-within:ring-[3px] ${fieldErrors.password ? 'border-clay-500 focus-within:ring-clay-100' : 'border-ivory-300 focus-within:border-sage-600 focus-within:ring-sage-200/70'}`}>
                <BsLock className="text-ink-300 shrink-0" />
                <input
                  id="password"
                  onChange={handleChange}
                  value={userRegisterData.password}
                  name="password"
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>

          <div className="mt-7 text-center text-[13px] text-ink-400">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-sage-700 transition-colors hover:text-sage-600 hover:underline">
              Log in
            </a>
          </div>
        </AuthLayout>
    )
}

export default Register