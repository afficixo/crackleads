"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getDashboardPath } from "@/lib/auth/dashboard-path"
import PublicLayout from "@/components/layout/PublicLayout"
import { signupCountries } from "@/lib/signup-countries"
import styles from "./Signup.module.css"

function buildUsername(email: string) {
  const local = email.split("@")[0] ?? "publisher"
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 20) || "publisher"
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${cleaned}${suffix}`
}

export default function SignupClient() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipcode, setZipcode] = useState("")
  const [country, setCountry] = useState("")
  const [skype, setSkype] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [verticals, setVerticals] = useState("")
  const [traffic, setTraffic] = useState("")
  const [hearAbout, setHearAbout] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaPrompt, setCaptchaPrompt] = useState("3 + 4")
  const [captchaValue, setCaptchaValue] = useState(7)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaError, setCaptchaError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [approvalPendingSuccess, setApprovalPendingSuccess] = useState(false)

  const generateCaptcha = useCallback(() => {
    const first = Math.floor(Math.random() * 9) + 1
    const second = Math.floor(Math.random() * 9) + 1
    setCaptchaPrompt(`${first} + ${second}`)
    setCaptchaValue(first + second)
    setCaptchaAnswer("")
    setCaptchaVerified(false)
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
  }, [router])

  useEffect(() => {
    const answer = Number(captchaAnswer)
    if (Number.isInteger(answer) && answer === captchaValue) {
      setCaptchaVerified(true)
      setCaptchaError("")
    } else if (captchaAnswer !== "") {
      setCaptchaVerified(false)
    }
  }, [captchaAnswer, captchaValue])

  const countryName = useMemo(
    () => signupCountries.find((item) => item.code === country)?.name ?? country,
    [country]
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setCaptchaError("")

    if (!agreed) {
      setError("Please confirm that you agree to the Terms and Conditions and Privacy Policy.")
      return
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.")
      return
    }

    if (!captchaVerified) {
      setCaptchaError("Please complete the verification challenge.")
      return
    }

    const answer = Number(captchaAnswer)
    if (!Number.isInteger(answer) || answer !== captchaValue) {
      setCaptchaError("Please solve the verification question correctly before continuing.")
      setCaptchaVerified(false)
      return
    }

    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const fullAddress = [address.trim(), city.trim(), state.trim(), zipcode.trim(), countryName]
      .filter(Boolean)
      .join(", ")
    const contractDigits = zipcode.replace(/\D/g, "") || String(Date.now()).slice(-8)
    const sourceParts = [verticals.trim(), traffic.trim(), hearAbout.trim()].filter(Boolean)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          address: fullAddress,
          contractNumber: contractDigits,
          username: buildUsername(email),
          email,
          password,
          referralCode,
          telegramUsername: skype.trim() || undefined,
          source: sourceParts.join(" | ") || undefined,
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
      generateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout className="!bg-white" footerVariant="auth">
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Publisher Sign Up</h1>
          {referralCode ? (
            <p className={styles.referralNote}>
              You were invited by a publisher. Your account will be linked to their referral.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {error ? (
              <div role="alert" className={styles.alert}>
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                role="status"
                aria-live="polite"
                className={`${styles.alert} ${styles.alertSuccess}`}
              >
                {approvalPendingSuccess
                  ? "Account created. Your publisher account is pending manager approval."
                  : success}
              </div>
            ) : null}

            <h5 className={styles.sectionTitle}>Personal details</h5>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col6}`}>
                <input
                  id="firstName"
                  name="first_name"
                  type="text"
                  className={styles.control}
                  placeholder="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="given-name"
                />
              </div>
              <div className={`${styles.formGroup} ${styles.col6}`}>
                <input
                  id="lastName"
                  name="last_name"
                  type="text"
                  className={styles.control}
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className={styles.formGroupFlush}>
              <input
                id="inputEmail"
                name="email"
                type="email"
                className={styles.control}
                placeholder="E-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col8}`}>
                <input
                  id="inputAddress"
                  name="address"
                  type="text"
                  className={styles.control}
                  placeholder="Address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="street-address"
                />
              </div>
              <div className={`${styles.formGroup} ${styles.col4}`}>
                <input
                  id="inputCity"
                  name="city"
                  type="text"
                  className={styles.control}
                  placeholder="City"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="address-level2"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col4}`}>
                <input
                  id="inputState"
                  name="state"
                  type="text"
                  className={styles.control}
                  placeholder="State"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="address-level1"
                />
              </div>
              <div className={`${styles.formGroup} ${styles.col4}`}>
                <input
                  id="inputZip"
                  name="zipcode"
                  type="text"
                  className={styles.control}
                  placeholder="ZIP Code"
                  value={zipcode}
                  onChange={(event) => setZipcode(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="postal-code"
                />
              </div>
              <div className={`${styles.formGroup} ${styles.col4}`}>
                <select
                  id="inputCountry"
                  name="country"
                  className={`${styles.select}${country ? ` ${styles.selectHasValue}` : ""}`}
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  required
                  disabled={loading}
                  aria-label="Select country"
                >
                  <option value="">Select country</option>
                  {signupCountries.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroupFlush}>
              <input
                id="inputSkype"
                name="skype"
                type="text"
                className={styles.control}
                placeholder="Teams ID (Skype) or Telegram"
                value={skype}
                onChange={(event) => setSkype(event.target.value)}
                disabled={loading}
                autoComplete="nickname"
              />
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col6}`}>
                <input
                  id="inputPassword"
                  name="pass"
                  type="password"
                  className={styles.control}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <div className={`${styles.formGroup} ${styles.col6}`}>
                <input
                  id="inputPassword2"
                  name="pass_repeat"
                  type="password"
                  className={styles.control}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <h5 className={styles.sectionTitle}>Traffic information</h5>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col12}`}>
                <textarea
                  id="inputTrafficVerticals"
                  name="verticals"
                  rows={2}
                  className={styles.textarea}
                  placeholder="What niches/verticals are you interested in?"
                  value={verticals}
                  onChange={(event) => setVerticals(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col12}`}>
                <textarea
                  id="inputTrafficSource"
                  name="traffic"
                  rows={2}
                  className={styles.textarea}
                  placeholder="Describe your traffic sources and promotion methods"
                  value={traffic}
                  onChange={(event) => setTraffic(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.col12}`}>
                <input
                  id="inputHearAboutUs"
                  name="hearabout"
                  type="text"
                  className={styles.control}
                  placeholder="How did you hear about us? (optional)"
                  value={hearAbout}
                  onChange={(event) => setHearAbout(event.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formGroupFlush}>
              <div className={styles.checkboxWrap}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  id="gridCheck"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  required
                  disabled={loading}
                />
                <label className={styles.checkboxLabel} htmlFor="gridCheck">
                  I confirm that I have read, understand and agree to the{" "}
                  <Link href="/terms" target="_blank">
                    Terms and Conditions
                  </Link>
                  , and{" "}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>{" "}
                  of Affmine LLC.
                </label>
              </div>
            </div>

            <div className={styles.captcha} aria-live="polite">
              {captchaVerified ? (
                <div className={styles.captchaSuccess}>
                  <span className={styles.captchaCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span className={styles.captchaSuccessText}>Success!</span>
                </div>
              ) : (
                <div className={styles.captchaChallenge}>
                  <label htmlFor="captcha-answer" className={styles.captchaPrompt}>
                    {captchaPrompt} =
                  </label>
                  <input
                    id="captcha-answer"
                    name="captchaAnswer"
                    type="number"
                    inputMode="numeric"
                    value={captchaAnswer}
                    onChange={(event) => setCaptchaAnswer(event.target.value)}
                    className={styles.captchaInput}
                    required
                    disabled={loading}
                    aria-invalid={!!captchaError}
                  />
                </div>
              )}
              <div className={styles.captchaBrand}>
                <strong>Verify</strong>
                <span>Privacy</span>
              </div>
            </div>
            {captchaError ? <p className={styles.alertError}>{captchaError}</p> : null}

            <button type="submit" name="btn-join" value="1" className={styles.submit} disabled={loading}>
              {loading ? "…" : "Next"}
            </button>
          </form>
        </div>
      </main>
    </PublicLayout>
  )
}
