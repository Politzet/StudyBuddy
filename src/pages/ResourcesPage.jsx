import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import { API_BASE_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'
import { getAlertActionClass, getAlertClass } from '../styles/alertStyles'

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'

function ResourcesPage() {
  const { user } = useSelector((state) => state.user)
  const userId = user?.id || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || ''
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [viewFilter, setViewFilter] = useState('all')

  const { data: moodleData } = useFetch(`${API_BASE_URL}/api/moodle/sync`)
  const moodleTasks = useMemo(
    () =>
      Array.isArray(moodleData?.tasks)
        ? moodleData.tasks.filter((task) => task.course && task.title)
        : [],
    [moodleData],
  )
  const moodleProjects = useMemo(
    () =>
      Array.isArray(moodleData?.projects)
        ? moodleData.projects.filter((project) => project.course && project.title)
        : [],
    [moodleData],
  )

  const learningItems = useMemo(
    () => [
      ...moodleTasks.map((task) => ({
        id: `task-${task.id || task.title}`,
        course: task.course,
        title: task.title,
        kind: 'assignment',
      })),
      ...moodleProjects.map((project) => ({
        id: `project-${project.id || project.title}`,
        course: project.course,
        title: project.title,
        kind: 'project',
      })),
    ],
    [moodleTasks, moodleProjects],
  )

  const courses = useMemo(
    () => Array.from(new Set(learningItems.map((item) => item.course))).sort(),
    [learningItems],
  )

  const effectiveCourse = selectedCourse || courses[0] || ''

  const assignmentOptions = useMemo(
    () => learningItems.filter((item) => item.course === effectiveCourse),
    [learningItems, effectiveCourse],
  )

  const hasSelectedAssignment = assignmentOptions.some(
    (assignment) => assignment.title === selectedAssignment,
  )
  const effectiveAssignment =
    hasSelectedAssignment || !assignmentOptions.length
      ? selectedAssignment
      : assignmentOptions[0].title

  const strictQuery = useMemo(() => {
    if (!effectiveCourse || !effectiveAssignment) {
      return ''
    }
    return `${effectiveCourse} ${effectiveAssignment} tutorial`
  }, [effectiveCourse, effectiveAssignment])

  const youtubeUrl = useMemo(() => {
    if (!youtubeApiKey || !strictQuery) {
      return ''
    }
    const queryParams = new URLSearchParams({
      part: 'snippet',
      maxResults: '12',
      q: strictQuery,
      type: 'video',
      key: youtubeApiKey,
      strict: String(refreshSeed),
    })
    return `${YOUTUBE_SEARCH_URL}?${queryParams.toString()}`
  }, [youtubeApiKey, strictQuery, refreshSeed])

  const { data: youtubeData, loading, error } = useFetch(youtubeUrl)

  const videos = useMemo(() => {
    const items = Array.isArray(youtubeData?.items) ? youtubeData.items : []
    return items
      .filter((item) => item?.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet?.title || 'Untitled video',
        channelTitle: item.snippet?.channelTitle || 'Unknown channel',
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
      }))
  }, [youtubeData])

  const [favoritesRefresh, setFavoritesRefresh] = useState(0)
  const [favoritesError, setFavoritesError] = useState('')
  const [savingFavoriteId, setSavingFavoriteId] = useState('')
  const [noteDrafts, setNoteDrafts] = useState({})
  const { data: favoritesData, refetch: refetchFavorites } = useFetch(
    userId
      ? `${API_BASE_URL}/api/favorite-videos?userId=${encodeURIComponent(userId)}&r=${favoritesRefresh}`
      : '',
  )

  const favorites = useMemo(
    () => (Array.isArray(favoritesData) ? favoritesData : []),
    [favoritesData],
  )
  const favoriteByVideoId = useMemo(() => {
    const map = new Map()
    for (const favorite of favorites) {
      map.set(favorite.videoId, favorite)
    }
    return map
  }, [favorites])

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value)
    setSelectedAssignment('')
    setRefreshSeed((prev) => prev + 1)
  }

  const saveFavorite = async (video) => {
    if (!userId) {
      setFavoritesError('Please log in to save favorites.')
      return
    }

    const note = noteDrafts[video.id] ?? favoriteByVideoId.get(video.id)?.personalNote ?? ''
    setFavoritesError('')
    setSavingFavoriteId(video.id)
    try {
      const response = await fetch(`${API_BASE_URL}/api/favorite-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnail: video.thumbnail,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
          course: effectiveCourse,
          assignmentName: effectiveAssignment,
          personalNote: note,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to save favorite video')
      }

      refetchFavorites()
      setFavoritesRefresh((prev) => prev + 1)
    } catch (saveError) {
      setFavoritesError(saveError.message)
    } finally {
      setSavingFavoriteId('')
    }
  }

  const updateFavoriteNote = async (favoriteId, videoId) => {
    const note = noteDrafts[videoId] ?? ''
    setFavoritesError('')
    setSavingFavoriteId(videoId)
    try {
      const response = await fetch(`${API_BASE_URL}/api/favorite-videos/${favoriteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalNote: note }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to update note')
      }

      refetchFavorites()
      setFavoritesRefresh((prev) => prev + 1)
    } catch (updateError) {
      setFavoritesError(updateError.message)
    } finally {
      setSavingFavoriteId('')
    }
  }

  const deleteFavorite = async (favoriteId) => {
    if (!window.confirm('Are you sure you want to delete?')) {
      return
    }

    setFavoritesError('')
    setSavingFavoriteId(favoriteId)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorite-videos/${favoriteId}?userId=${encodeURIComponent(userId)}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to delete favorite video')
      }

      refetchFavorites()
      setFavoritesRefresh((prev) => prev + 1)
    } catch (deleteError) {
      setFavoritesError(deleteError.message)
    } finally {
      setSavingFavoriteId('')
    }
  }

  return (
    <section
      className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${
        isDark
          ? 'border-[#5a463b] bg-[#2d221d]/85 text-[#f6ede6]'
          : 'border-[#d9c7b8] bg-[#fff8f1]/88 text-[#453434]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Learning Hub</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff0000] px-3 py-1 text-xs font-semibold text-white">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              fill="currentColor"
              d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8M9.6 15.8V8.2L16 12z"
            />
          </svg>
          Live from YouTube
        </span>
      </div>
      <p className={`mt-2 ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
        Videos are strictly filtered by Moodle course and assignment context.
      </p>
      <span className="mt-3 inline-flex rounded-full bg-[#8b6b57] px-3 py-1 text-xs font-semibold text-white">
        Strictly Educational Content
      </span>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewFilter('all')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            viewFilter === 'all'
              ? 'bg-[#8b6b57] text-white'
              : isDark
                ? 'bg-[#3a2d26]/90 text-[#f5e7db] hover:bg-[#4a382f]'
                : 'bg-[#fff7ef] text-[#5a463b] hover:bg-[#f1e2d5]'
          }`}
        >
          All Results
        </button>
        <button
          type="button"
          onClick={() => setViewFilter('favorites')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            viewFilter === 'favorites'
              ? 'bg-[#8b6b57] text-white'
              : isDark
                ? 'bg-[#3a2d26]/90 text-[#f5e7db] hover:bg-[#4a382f]'
                : 'bg-[#fff7ef] text-[#5a463b] hover:bg-[#f1e2d5]'
          }`}
        >
          Favorites Only ({favorites.length})
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <select
          value={effectiveCourse}
          onChange={handleCourseChange}
          className={`rounded-md border px-3 py-2 text-sm ${
            isDark
              ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
              : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
          }`}
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          value={effectiveAssignment}
          onChange={(event) => {
            setSelectedAssignment(event.target.value)
            setRefreshSeed((prev) => prev + 1)
          }}
          className={`rounded-md border px-3 py-2 text-sm ${
            isDark
              ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
              : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
          }`}
        >
          <option value="">Select Assignment</option>
          {assignmentOptions.map((item) => (
            <option key={item.id} value={item.title}>
              {item.title} {item.kind === 'project' ? '(Project)' : '(Assignment)'}
            </option>
          ))}
        </select>
      </div>

      <p className={`mt-2 text-xs ${isDark ? 'text-[#d7c3b4]' : 'text-[#7c6558]'}`}>
        Query: {strictQuery || 'Select a course and assignment'}
      </p>

      {error ? (
        <div className={getAlertClass('error', isDark)}>
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshSeed((prev) => prev + 1)}
            className={getAlertActionClass('error')}
          >
            Try Again
          </button>
        </div>
      ) : null}
      {favoritesError ? <div className={getAlertClass('error', isDark)}>{favoritesError}</div> : null}

      {!youtubeApiKey ? (
        <div className={getAlertClass('error', isDark)}>
          YouTube API key is missing. Please set VITE_YOUTUBE_API_KEY in .env.
        </div>
      ) : null}

      {loading ? (
        <div
          className={`mt-8 flex items-center justify-center gap-3 rounded-lg border px-4 py-6 ${
            isDark
              ? 'border-[#8b6b57] bg-[#3a2b24]/80 text-[#f6ede6]'
              : 'border-[#d9c7b8] bg-[#fff1e4] text-[#6b5447]'
          }`}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#8b6b57] border-t-transparent" />
          <span className="font-medium">Loading videos from YouTube...</span>
        </div>
      ) : null}

      {!loading && !error && strictQuery && viewFilter === 'all' ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <li
              key={video.id}
              className={`overflow-hidden rounded-lg border ${
                isDark
                  ? 'border-[#5f4a3f] bg-[#2f241f]/90'
                  : 'border-[#d9c7b8] bg-[#fffaf4]/95'
              }`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-semibold">{video.title}</h3>
                <p className={`mt-2 text-xs ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                  Channel: {video.channelTitle}
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-md bg-[#ff0000] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#cc0000]"
                >
                  Watch on YouTube
                </a>
                <div className="mt-3 space-y-2">
                  <textarea
                    value={
                      noteDrafts[video.id] ?? favoriteByVideoId.get(video.id)?.personalNote ?? ''
                    }
                    onChange={(event) =>
                      setNoteDrafts((prev) => ({ ...prev, [video.id]: event.target.value }))
                    }
                    placeholder="Add your personal note..."
                    className={`w-full rounded-md border px-3 py-2 text-xs ${
                      isDark
                        ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                        : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                    }`}
                    rows={2}
                  />
                  {favoriteByVideoId.get(video.id)?._id ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateFavoriteNote(favoriteByVideoId.get(video.id)._id, video.id)
                      }
                      disabled={savingFavoriteId === video.id}
                      className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#785845] disabled:opacity-70"
                    >
                      {savingFavoriteId === video.id ? 'Saving...' : 'Update Note'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => saveFavorite(video)}
                      disabled={savingFavoriteId === video.id}
                      className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#785845] disabled:opacity-70"
                    >
                      {savingFavoriteId === video.id ? 'Saving...' : 'Save to Favorites'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {viewFilter === 'favorites' ? (
        favorites.length === 0 ? (
          <div
            className={`mt-6 rounded-lg border px-4 py-4 text-sm ${
              isDark ? 'border-[#5f4a3f] bg-[#2f241f]/90' : 'border-[#d9c7b8] bg-[#fffaf4]/95'
            }`}
          >
            You have no favorites yet. Save videos to build your study list.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <li
                key={favorite._id}
                className={`overflow-hidden rounded-lg border ${
                  isDark
                    ? 'border-[#5f4a3f] bg-[#2f241f]/90'
                    : 'border-[#d9c7b8] bg-[#fffaf4]/95'
                }`}
              >
                {favorite.thumbnail ? (
                  <img
                    src={favorite.thumbnail}
                    alt={favorite.title}
                    className="h-44 w-full object-cover"
                  />
                ) : null}
                <div className="p-4">
                  <h4 className="line-clamp-2 text-sm font-semibold">{favorite.title}</h4>
                  <p className={`mt-2 text-xs ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                    Channel: {favorite.channelTitle || 'Unknown channel'}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-[#eadccf]' : 'text-[#6b5447]'}`}>
                    Context: {favorite.course || 'N/A'}
                    {favorite.assignmentName ? ` - ${favorite.assignmentName}` : ''}
                  </p>
                  <a
                    href={favorite.youtubeUrl || `https://www.youtube.com/watch?v=${favorite.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-md bg-[#ff0000] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#cc0000]"
                  >
                    Watch on YouTube
                  </a>
                  <textarea
                    value={noteDrafts[favorite.videoId] ?? favorite.personalNote ?? ''}
                    onChange={(event) =>
                      setNoteDrafts((prev) => ({ ...prev, [favorite.videoId]: event.target.value }))
                    }
                    placeholder="Add your personal note..."
                    className={`mt-3 w-full rounded-md border px-3 py-2 text-xs ${
                      isDark
                        ? 'border-[#6a5448] bg-[#2d221d] text-[#f6ede6]'
                        : 'border-[#d2c0b1] bg-[#fffaf6] text-[#453434]'
                    }`}
                    rows={3}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateFavoriteNote(favorite._id, favorite.videoId)}
                      disabled={savingFavoriteId === favorite.videoId}
                      className="rounded-md bg-[#8b6b57] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#785845] disabled:opacity-70"
                    >
                      {savingFavoriteId === favorite.videoId ? 'Saving...' : 'Save Note'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFavorite(favorite._id)}
                      disabled={savingFavoriteId === favorite._id}
                      className="rounded-md bg-[#6f3f3f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5d3434] disabled:opacity-70"
                    >
                      {savingFavoriteId === favorite._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}

export default ResourcesPage
