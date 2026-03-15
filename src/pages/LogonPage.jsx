import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { API_BASE_URL } from '../config/api'
import MagicLoader from '../components/MagicLoader'
import { login, setAuthLoading } from '../store/userSlice'
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

function LogonPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.user.auth)
  const [bgIndex, setBgIndex] = useState(0)
  const [logoIndex, setLogoIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [showSuccessBurst, setShowSuccessBurst] = useState(false)
  const [fadeFormAway, setFadeFormAway] = useState(false)
  const successPendingRef = useRef(false)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleBgError = () => {
    setBgIndex((prev) => Math.min(prev + 1, bgCandidates.length - 1))
  }

  const handleLogoError = () => {
    setLogoIndex((prev) => Math.min(prev + 1, logoCandidates.length - 1))
  }

  useEffect(() => {
    if (!successPendingRef.current || !auth.isAuthenticated || auth.isLoading) {
      return
    }
    setShowSuccessBurst(true)
    setFadeFormAway(true)

    const navigateTimer = setTimeout(() => {
      successPendingRef.current = false
      setShowSuccessBurst(false)
      navigate('/home')
    }, 1050)

    return () => clearTimeout(navigateTimer)
  }, [auth.isAuthenticated, auth.isLoading, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setEmailError('')

    const trimmedEmail = email.trim()
    if (!emailPattern.test(trimmedEmail)) {
      setEmailError('Please enter a valid email format.')
      return
    }

    try {
      dispatch(setAuthLoading(true))
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Invalid email or password')
      }

      const userData = await response.json()
      successPendingRef.current = true
      dispatch(
        login({
          name: userData.userName,
          email: userData.email,
          id: userData._id,
        }),
      )
    } catch (loginError) {
      successPendingRef.current = false
      setError(loginError.message)
    } finally {
      dispatch(setAuthLoading(false))
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
      {(auth.isLoading || showSuccessBurst) ? (
        <div className="absolute inset-0 bg-[#1e1a17]/45 backdrop-saturate-50" />
      ) : null}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div
          className={`w-full max-w-lg rounded-2xl bg-white/45 p-8 backdrop-blur-sm transition-opacity duration-500 ${
            fadeFormAway ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="mb-8 flex justify-center">
            <img
              src={logoCandidates[logoIndex]}
              onError={handleLogoError}
              alt="StudyBuddy logo"
              className="max-h-44 w-auto"
            />
          </div>

          {error ? (
            <div className={getAlertClass('error', false)}>
              <p className="text-center">{error}</p>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="logon-email"
                className="mb-2 block text-3/4 font-semibold text-[#453434]"
              >
                Email:
              </label>
              <input
                id="logon-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailError('')
                }}
                className="w-full rounded-full bg-white/75 px-4 py-2 text-[#453434] outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-[#453434]/40"
                required
              />
              {emailError ? <p className="mt-1 text-sm text-red-700">{emailError}</p> : null}
            </div>
            <div>
              <label
                htmlFor="logon-password"
                className="mb-2 block text-3/4 font-semibold text-[#453434]"
              >
                Password:
              </label>
              <input
                id="logon-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-full bg-white/75 px-4 py-2 text-[#453434] outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-[#453434]/40"
                required
              />
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={auth.isLoading}
                className="inline-flex rounded-full bg-[#8b6b57] px-8 py-2 font-semibold text-white transition hover:bg-[#785845] disabled:opacity-70"
              >
                {auth.isLoading ? 'Logging in...' : 'Logon'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-[#453434]">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold underline">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {auth.isLoading || showSuccessBurst ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <MagicLoader burst={showSuccessBurst} />
        </div>
      ) : null}
    </section>
  )
}

export default LogonPage
