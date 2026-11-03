import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AlertData } from '../components/Alert';
import AuthLayout from '../components/AuthLayout';
import { BsKeyFill } from 'react-icons/bs';

const OTP_TTL_SECONDS = 2 * 60;
const OTP_SENT_AT_KEY = "otpSentAt";

const getRemainingSeconds = () => {
  const sentAt = Number(localStorage.getItem(OTP_SENT_AT_KEY));
  if (!Number.isFinite(sentAt) || sentAt <= 0) return OTP_TTL_SECONDS;
  const remaining = Math.ceil(
    (sentAt + OTP_TTL_SECONDS * 1000 - Date.now()) / 1000
  );
  return Math.min(OTP_TTL_SECONDS, Math.max(0, remaining));
};

const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const OtpPage = ({setAlert}:{ setAlert: React.Dispatch<React.SetStateAction<AlertData | null>> }) => {
  const [otp,setOtp]=useState<string>("");
  const [verifying,setVerifying]=useState<boolean>(false);
  const [resending,setResending]=useState<boolean>(false);
  const [secondsLeft,setSecondsLeft]=useState<number>(getRemainingSeconds);
  const navigate=useNavigate();
  const email=localStorage.getItem("email");
  const busy = verifying || resending;

  useEffect(() => {
    const tick = () => setSecondsLeft(getRemainingSeconds());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);


  const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    setOtp(e.target.value)
  }

  const handleSubmitOTP=async()=>{
  if (busy) return
  setVerifying(true)
try{
  
  const otpData={
    otp,
    email
  }

    const res=await axios.post(`${import.meta.env.VITE_BACKEND_API}/verify-otp`,otpData);
  if(res.status===200){
    setAlert({ type: 'success', title: 'OTP verified', message: res.data.message })
    navigate("/reset-password")
  }

}catch(err){
  if(axios.isAxiosError(err)){
      const data = err.response?.data
      if(data?.message){
        setAlert({
          type:"error",
          title:"Error Verifying OTP",
          message:data.message
        })
        console.error("OTP Verification failed",data.message)
      }
  }else{
    setAlert({
      type:"error",
      title:"Error Verifying OTP",
      message:"OTP Verification Failed"
    })
  }
  console.error(err)
}finally{
  setVerifying(false)
}
  }
  const resendOtp=async()=>{
    if (busy || secondsLeft > 0) return
    setResending(true)
    const resendEmail={
      email
    }
try{
   const res=await axios.patch(`${import.meta.env.VITE_BACKEND_API}/resend-otp`,resendEmail);
    if(res.status===200){
      localStorage.setItem(OTP_SENT_AT_KEY, String(Date.now()))
      setSecondsLeft(OTP_TTL_SECONDS)
      setAlert({ type: 'info', title: 'OTP resent', message: res.data.message || 'A new OTP has been sent.' })
      return
    }
}catch(err){
  const errorMessage = axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Unable to resend OTP."
  setAlert({ type: 'error', title: 'Resend failed', message: errorMessage })
  console.log(err)
}finally{
  setResending(false)
}
 

  }
  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Enter your OTP"
      subtitle={
        <>
          We've sent a one-time code to{" "}
          <span className="font-semibold text-ink-700">{email || "your email"}</span>.
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
            <BsKeyFill size={22} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="otp" className="label-luxe text-center">One-time code</label>
          <input
            id="otp"
            onChange={handleChange}
            value={otp}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            className="input-luxe py-3 text-center font-display text-xl tracking-[0.5em]"
          />
        </div>

        <button
          onClick={handleSubmitOTP}
          disabled={busy || otp.trim().length < 4}
          aria-busy={verifying}
          className="btn-primary w-full py-3 text-[13.5px]"
        >
          {verifying && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {verifying ? "Verifying…" : "Verify and continue"}
        </button>
      </div>

      <div className="mt-6 text-center text-[13px] text-ink-400">
        Didn't receive it?{" "}
        <button
          onClick={resendOtp}
          disabled={busy || secondsLeft > 0}
          aria-busy={resending}
          className="font-semibold tabular-nums text-sage-700 transition-colors hover:text-sage-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending
            ? "Resending…"
            : secondsLeft > 0
              ? `Resend OTP in ${formatCountdown(secondsLeft)} min`
              : "Resend OTP"}
        </button>
      </div>
    </AuthLayout>
  )
}

export default OtpPage