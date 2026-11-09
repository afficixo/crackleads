"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getDashboardPath } from "@/lib/auth/dashboard-path"
import PublicLayout from "@/components/layout/PublicLayout"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  PhoneCall,
  RefreshCw,
  Rocket,
  User,
} from "lucide-react"

const inputClassName =
  "min-h-11 w-full rounded-md border border-[#cbd5d9] bg-white px-3.5 py-2.5 text-base text-[#263238] placeholder-[#87949b] outline-none transition focus:border-[#168b55] focus:ring-2 focus:ring-[#168b55]/15 disabled:cursor-not-allowed disabled:bg-[#f1f3f5]"

const sectionHeadingClassName =
  "border-b border-[#e6ebed] pb-2 text-base font-semibold text-[#263238]"

export default function SignupClient() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [address, setAddress] = useState("")
  const [contractNumber, setContractNumber] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaPrompt, setCaptchaPrompt] = useState("3 + 4")
  const [captchaValue, setCaptchaValue] = useState(7)
  const [captchaError, setCaptchaError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [approvalPendingSuccess, setApprovalPendingSuccess] = useState(false)
  const [contractError, setContractError] = useState("")

  const generateCaptcha = useCallback(() => {
    const first = Math.floor(Math.random() * 9) + 1
    const second = Math.floor(Math.random() * 9) + 1
    setCaptchaPrompt(`${first} + ${second}`)
    setCaptchaValue(first + second)
    setCaptchaAnswer("")
    setCaptchaError("")
  }, [])

  useEffect(() => {
    generateCaptcha()
  }, [generateCaptcha])

  useEffect(() => {
    setReferralCode(new URLSearchParams(window.location.search).get("ref")?.trim() ?? "")
  }, [])

  useEffect(() => {
    setError("")
    setSuccess("")
    setApprovalPendingSuccess(false)
    setContractError("")
  }, [router])

  const handleContractChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "")
    setContractNumber(value)
    if (contractError) setContractError("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setCaptchaError("")
    setContractError("")

    if (!/^\d+$/.test(contractNumber)) {
      setContractError("Contract Number must contain digits only")
      return
    }

    const answer = Number(captchaAnswer)
    if (!Number.isInteger(answer) || answer !== captchaValue) {
      setCaptchaError("Please solve the verification question correctly before continuing.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          address,
          contractNumber,
          username,
          email,
          password,
          referralCode,
          captchaPrompt,
          captchaAnswer: answer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      if (data?.requiresApproval) {
        setApprovalPendingSuccess(true)
        setSuccess(
          "Account created. Your publisher account is pending manager approval. You can sign in after it has been approved."
        )
        window.setTimeout(() => {
          router.push("/login?approval_pending=1")
        }, 1200)
        return
      }

      setSuccess("Account created. Redirecting you to your dashboard...")
      window.setTimeout(() => {
        router.push(getDashboardPath(data?.user?.role))
      }, 500)
    } catch (submitError) {
      setSuccess("")
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not create your account. Check your details and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout className="!bg-white">
      <main className="flex-1 bg-[#f7f9fa] px-4 pb-12 pt-28 sm:px-6 md:pb-16 md:pt-32">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-7 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0e7a4d]">
              Join Afficix
            </p>
            <h1 className="font-[Montserrat] text-3xl font-bold leading-tight text-[#263238] sm:text-4xl">
              Publisher Sign Up
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-6 text-[#6b7c87]">
              Create your publisher account to get started. Your manager will review your application.
            </p>
            {referralCode && (
              <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-[#0e7a4d]">
                You were invited by a publisher. Your account will be linked to their referral.
              </p>
            )}
          </header>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#e1e7e9] bg-white p-5 shadow-[0_16px_48px_-32px_rgba(38,50,56,0.3)] sm:p-8"
          >
            {error && (
              <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                aria-live="polite"
                className={
                  approvalPendingSuccess
                    ? "mb-6 overflow-hidden rounded-lg border border-[#9dcfc0] bg-[#eef8f4] text-[#31584e]"
                    : "mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
                }
              >
                {approvalPendingSuccess ? (
                  <div className="flex items-start gap-3 p-4">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Approval pending</p>
                      <p className="mt-1 text-sm leading-6">
                        Your account is awaiting contract approval. You can sign in once it has been approved.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{success}</span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-7">
              <section aria-labelledby="signup-personal-details">
                <h2 id="signup-personal-details" className={sectionHeadingClassName}>
                  Personal details
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-sm font-medium text-[#34464f]">Full name</label>
                    <div className="relative">
                      <User aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="Your full name"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-[#34464f]">Email address</label>
                    <div className="relative">
                      <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-[#34464f]">Address</label>
                    <div className="relative">
                      <MapPin aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="address"
                        name="address"
                        type="text"
                        autoComplete="street-address"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="Street address"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contractNumber" className="block text-sm font-medium text-[#34464f]">Contract number</label>
                    <div className="relative">
                      <PhoneCall aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="contractNumber"
                        name="contractNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={contractNumber}
                        onChange={handleContractChange}
                        aria-invalid={!!contractError}
                        aria-describedby={contractError ? "contract-number-error" : undefined}
                        className={`${inputClassName} pl-10`}
                        placeholder="Enter your contract number"
                        required
                        disabled={loading}
                      />
                    </div>
                    {contractError && (
                      <p id="contract-number-error" className="text-sm text-red-700">{contractError}</p>
                    )}
                  </div>

                </div>
              </section>

              <section aria-labelledby="signup-account-details">
                <h2 id="signup-account-details" className={sectionHeadingClassName}>
                  Account details
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="username" className="block text-sm font-medium text-[#34464f]">Username</label>
                    <div className="relative">
                      <User aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="Choose a username"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-[#34464f]">Password</label>
                    <div className="relative">
                      <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74818a]" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClassName} pl-10 pr-11`}
                        placeholder="Create a strong password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#74818a] transition-colors hover:text-[#263238] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168b55]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section aria-labelledby="signup-verification">
                <h2 id="signup-verification" className={sectionHeadingClassName}>
                  Verification
                </h2>
                <div className="mt-4 rounded-lg border border-[#e1e7e9] bg-[#f7f9fa] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#34464f]">Solve this quick question</p>
                      <p className="mt-1 text-base font-semibold text-[#263238]">{captchaPrompt} = ?</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="captcha-answer" className="sr-only">Answer to verification question</label>
                      <input
                        id="captcha-answer"
                        name="captchaAnswer"
                        type="number"
                        inputMode="numeric"
                        value={captchaAnswer}
                        onChange={(event) => setCaptchaAnswer(event.target.value)}
                        aria-invalid={!!captchaError}
                        aria-describedby={captchaError ? "captcha-error" : undefined}
                        className="min-h-11 w-full rounded-md border border-[#cbd5d9] bg-white px-3 py-2 text-base text-[#263238] placeholder-[#87949b] outline-none transition focus:border-[#168b55] focus:ring-2 focus:ring-[#168b55]/15 sm:w-32"
                        placeholder="Answer"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#cbd5d9] bg-white text-[#455964] transition-colors hover:bg-[#edf2f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168b55]"
                        disabled={loading}
                        aria-label="Refresh verification question"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {captchaError && (
                    <p id="captcha-error" className="mt-2 text-sm text-red-700">{captchaError}</p>
                  )}
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1ba1b4] px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#168b9c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1ba1b4]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Create publisher account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm leading-6 text-[#6b7c87]">
                Your account will be reviewed before publisher access is approved.
              </p>
            </div>
          </form>

          <p className="mt-6 text-center text-base text-[#6b7c87]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0e7a4d] underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </PublicLayout>
  )
}
