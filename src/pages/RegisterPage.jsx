import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { getAlertClass } from '../styles/alertStyles'

const bgCandidates = [
  '/src/assets/images/logon page background.png',
  '/src/assets/images/logon page background.jpg',
  '/src/assets/images/logon page background.jpeg',
  '/src/assets/images/logon page background.webp',
]

const logoCandidates = [
  '/src/assets/images/logon page logo.png',
  '/src/assets/images/logon page logo.jpg',
  '/src/assets/images/logon page logo.jpeg',
  '/src/assets/images/logon page logo.webp',
]

function RegisterPage() {
  const navigate = useNavigate()
  const [bgIndex, setBgIndex] = useState(0)
  const [logoIndex, setLogoIndex] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleBgError = () => {
    setBgIndex((prev) => Math.min(prev + 1, bgCandidates.length - 1))
  }

  const handleLogoError = () => {
    setLogoIndex((prev) => Math.min(prev + 1, logoCandidates.length - 1))
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePasswordBlur = () => {
    setFieldErrors((prev) => ({
      ...prev,
      password:
        formData.password.length > 0 && formData.password.length < 8
          ? 'Password must be at least 8 characters.'
          : '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const nextFieldErrors = {}
    const trimmedEmail = formData.email.trim()

    if (!emailPattern.test(trimmedEmail)) {
      nextFieldErrors.email = 'Please enter a valid email format.'
    }

    if (formData.password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.'
    }

    if (formData.password !== formData.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          userName: formData.userName,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(
          body.message ||
            (Array.isArray(body.details) ? body.details.join(', ') : '') ||
            'Failed to create account',
        )
      }

      navigate('/')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      <img
        src={bgCandidates[bgIndex]}
        onError={handleBgError}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-white/55" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg p-8">
          <div className="mb-4 flex justify-center">
            <img
              src={logoCandidates[logoIndex]}
              onError={handleLogoError}
              alt="StudyBuddy logo"
              className="max-h-52 w-auto"
            />
          </div>

          {error ? (
            <div className={getAlertClass('error', false)}>
              <p className="text-center">{error}</p>
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="mx-auto w-full max-w-[400px]">
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d4af37]/40 bg-[#f7efe4]/85 px-4 py-2.5 text-[#453434] outline-none placeholder:text-[rgba(101,84,71,0.6)] focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25"
                required
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-sm text-red-700">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="mx-auto w-full max-w-[400px]">
              <input
                name="userName"
                type="text"
                placeholder="User Name"
                value={formData.userName}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d4af37]/40 bg-[#f7efe4]/85 px-4 py-2.5 text-[#453434] outline-none placeholder:text-[rgba(101,84,71,0.6)] focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25"
                required
              />
            </div>
            <div className="mx-auto w-full max-w-[400px]">
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handlePasswordBlur}
                className="w-full rounded-md border border-[#d4af37]/40 bg-[#f7efe4]/85 px-4 py-2.5 text-[#453434] outline-none placeholder:text-[rgba(101,84,71,0.6)] focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25"
                required
              />
              {fieldErrors.password ? (
                <p className="mt-1 text-sm text-red-700">{fieldErrors.password}</p>
              ) : null}
            </div>
            <div className="mx-auto w-full max-w-[400px]">
              <input
                name="confirmPassword"
                type="password"
                placeholder="Reenter Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-md border border-[#d4af37]/40 bg-[#f7efe4]/85 px-4 py-2.5 text-[#453434] outline-none placeholder:text-[rgba(101,84,71,0.6)] focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25"
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="mt-1 text-sm text-red-700">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <div className="pt-1 text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex rounded-full bg-[#8b6b57] px-8 py-2 font-semibold text-white transition hover:bg-[#785845] disabled:opacity-70"
              >
                {isSubmitting ? 'Creating...' : 'Create My Account'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-[#453434]">
            Already have an account?{' '}
            <Link to="/" className="font-semibold underline">
              Logon here
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
