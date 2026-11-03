import React from "react";

const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Small eyebrow text above the form title */
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  /** When true, the wordmark reads "ConnectHub Admin" */
  admin?: boolean;
}

const AuthLayout = ({
  children,
  eyebrow,
  title,
  admin = false,
}: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-ivory-100">
      {/* ── Brand panel ─────────────────────────── */}
      <div className="relative hidden w-[44%] overflow-hidden bg-ink-900 lg:block xl:w-[46%]">
        {/* soft radial glow accents */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-sage-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-gold-600/20 blur-[120px]" />

        {/* fine grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* editorial ornament */}
        <div className="pointer-events-none absolute left-10 top-12 text-[#5C5850]/60 select-none">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l2.6 5.4L20 9.6l-4 4 .9 5.8L12 16.9 7.1 19.4 8 13.6l-4-4 5.4-1.2L12 3z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ivory-100">
              <span style={serif} className="text-[15px] font-semibold tracking-tight text-ink-900">CH</span>
            </div>
            <div>
              <p style={serif} className="text-lg leading-none font-medium text-ivory-100">ConnectHub</p>
            
            </div>
          </div>

          <div>
            <h1
              style={serif}
              className="text-[34px] leading-[1.15] font-light text-ivory-50 xl:text-[40px]"
            >
              {admin ? (
                <>
                  Quiet authority,
                  <br />
                  <em className="font-normal text-ivory-100">measured influence.</em>
                </>
              ) : (
                <>
                  Where every connection begins.
                  <br />
                 
                </>
              )}
            </h1>
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-ink-300">
     Connect with friends, share your moments, and discover the stories that bring us together.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-px w-14 bg-ivory-100/25" />
            <p className="text-[11px] tracking-[0.24em] text-ivory-100/60 uppercase">
              Established · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px] animate-fade-up">
          {/* Mobile wordmark */}
          <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900">
              <span style={serif} className="text-[13px] font-medium text-white">CH</span>
            </div>
            <span style={serif} className="text-xl font-medium tracking-tight text-ink-900">ConnectHub</span>
          </div>

          <div className="card-luxe p-8 sm:p-10" style={{ boxShadow: "0 1px 2px rgba(31,29,26,0.04), 0 24px 60px rgba(31,29,26,0.08)" }}>
            <div className="mb-8">
              {eyebrow && (
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.26em] text-gold-600">
                  {eyebrow}
                </p>
              )}
              <h2 style={serif} className="text-[26px] font-medium tracking-tight text-ink-900">
                {title}
              </h2>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;