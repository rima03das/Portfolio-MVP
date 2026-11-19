import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteArtwork,
  deleteComment,
  getAdminArtworks,
  getAdminArtwork,
  getAdminComments,
  getDashboard,
  imageUrl,
  saveArtwork,
  updateArtworkStatus,
} from '../api'
import type { AdminComment, Artwork, ArtworkInput, Dashboard, Medium } from '../types'
import { mediums } from '../types'

function AdminLayout({ children, title, copy, action }: {
  children: ReactNode
  title: string
  copy: string
  action?: ReactNode
}) {
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <p className="eyebrow">Studio</p>
        <nav aria-label="Studio navigation">
          <Link to="/admin">Overview</Link>
          <Link to="/admin/artworks">All artworks</Link>
          {mediums.map((medium) => (
            <Link key={medium} to={`/admin/artworks?medium=${encodeURIComponent(medium)}`}>{medium}</Link>
          ))}
          <Link to="/admin/comments">Visitor comments</Link>
        </nav>
        <div className="sidebar-note"><strong>Your studio, your data.</strong><span>Saved locally on this device.</span></div>
      </aside>
      <section className="admin-content">
        <div className="admin-heading">
          <div><p className="eyebrow">Artist dashboard</p><h1>{title}</h1><p>{copy}</p></div>
          {action}
        </div>
        {children}
      </section>
    </main>
  )
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="inline-error" role="alert"><span>{message}</span><button className="text-button" onClick={retry}>Try again</button></div>
}

const metricLabels = [
  { key: 'uploaded', label: 'Uploaded', color: 'uploaded', status: 'UPLOADED' },
  { key: 'published', label: 'Published', color: 'published', status: 'PUBLISHED' },
  { key: 'unpublished', label: 'Unpublished', color: 'unpublished', status: 'UNPUBLISHED' },
  { key: 'views', label: 'Views', color: 'views' },
  { key: 'likes', label: 'Likes', color: 'likes' },
  { key: 'dislikes', label: 'Dislikes', color: 'dislikes' },
  { key: 'comments', label: 'Comments', color: 'reviews' },
] as const

function EngagementChart({ dashboard }: { dashboard: Dashboard }) {
  const maximumViews = Math.max(1, ...dashboard.monthly.map((entry) => entry.views))
  const maximumLikes = Math.max(1, ...dashboard.monthly.map((entry) => entry.likes))
  return (
    <section className="panel dashboard-panel chart-panel">
      <div className="panel-heading"><div><p className="eyebrow">The past six months</p><h2>Engagement over time</h2></div><span className="mini-note">Views and likes by month</span></div>
      <div className="chart-legend"><span><i className="legend-dot views" />Views</span><span><i className="legend-dot likes" />Likes</span></div>
      <div className="engagement-chart" role="img" aria-label="Monthly views and likes chart">
        {dashboard.monthly.map((month) => (
          <div className="chart-column" key={month.month} title={`${month.month}: ${month.views} views, ${month.likes} likes`}>
            <div className="chart-bars">
              <span className="chart-bar view-bar" style={{ height: `${Math.max(3, month.views / maximumViews * 100)}%` }} />
              <span className="chart-bar like-bar" style={{ height: `${Math.max(3, month.likes / maximumLikes * 100)}%` }} />
            </div>
            <span className="chart-month">{month.month}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      setDashboard(await getDashboard())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Dashboard could not be loaded.')
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <AdminLayout
      title="Portfolio overview"
      copy="A clear view of your collection and the attention each piece receives."
      action={<Link className="button button-primary" to="/admin/artworks/new">＋ New artwork</Link>}
    >
      {error && <ErrorState message={error} retry={() => void load()} />}
      {!dashboard ? !error && <p className="loading-inline">Loading your studio…</p> : (
        <>
          <section className="metric-grid" aria-label="Portfolio metrics">
            {metricLabels.map((metric) => {
              const status = 'status' in metric ? metric.status : undefined
              return (
                <Link
                  className={`metric-card metric-${metric.color}`}
                  key={metric.key}
                  to={status ? `/admin/artworks?status=${status}` : metric.key === 'comments' ? '/admin/comments' : '/admin/artworks?sort=popular'}
                >
                  <span className="metric-label">{metric.label}</span>
                  <strong className="metric-value">{dashboard[metric.key]}</strong>
                  <span className="metric-foot">{metric.key === 'views' ? 'Artwork views' : metric.key === 'comments' ? 'Visitor notes' : 'Portfolio records'}</span>
                </Link>
              )
            })}
          </section>
          <div className="dashboard-columns">
            <EngagementChart dashboard={dashboard} />
            <section className="panel dashboard-panel">
              <div className="panel-heading"><div><p className="eyebrow">By medium</p><h2>Collection snapshot</h2></div></div>
              <div className="medium-summary-list">
                {dashboard.byMedium.map((item, index) => (
                  <Link className="medium-summary" key={item.medium} to={`/admin/artworks?medium=${encodeURIComponent(item.medium)}`}>
                    <span className={`summary-mark summary-mark-${index + 1}`} />
                    <span className="summary-name">{item.medium}</span>
                    <span className="summary-count">{item.published} published</span>
                    <span className="summary-arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
          <div className="dashboard-columns lower-columns">
            <section className="panel dashboard-panel">
              <div className="panel-heading"><div><p className="eyebrow">Most seen</p><h2>Top works</h2></div><Link className="text-link" to="/admin/artworks?sort=popular">View all →</Link></div>
              <div className="top-work-list">
                {dashboard.topWorks.map((artwork) => (
                  <Link className="top-work" to={`/admin/artworks/${artwork.id}/edit`} key={artwork.id}>
                    <img src={imageUrl(artwork.imagePath)} alt="" />
                    <span><strong>{artwork.title}</strong><small>{artwork.medium}</small></span>
                    <b>{artwork.views} views</b>
                  </Link>
                ))}
              </div>
            </section>
            <section className="panel quick-actions">
              <p className="eyebrow">Keep things moving</p><h2>Quick actions</h2>
              <Link to="/admin/artworks">Edit artwork details <span>→</span></Link>
              <Link to="/admin/artworks/new">Add a new image <span>→</span></Link>
              <Link to="/admin/comments">Moderate visitor comments <span>→</span></Link>
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export function ArtworkManagement() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const initialMedium = query.get('medium')
  const initialStatus = query.get('status')
  const [medium, setMedium] = useState<Medium | 'ALL'>(mediums.includes(initialMedium as Medium) ? initialMedium as Medium : 'ALL')
  const [status, setStatus] = useState<'ALL' | Artwork['status']>(
    ['UPLOADED', 'PUBLISHED', 'UNPUBLISHED'].includes(initialStatus ?? '') ? initialStatus as Artwork['status'] : 'ALL',
  )
  const [sort, setSort] = useState(query.get('sort') ?? 'recent')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setArtworks(await getAdminArtworks({ medium, status, sort, search }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Artwork list could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [medium, search, sort, status])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  const changeStatus = async (artwork: Artwork) => {
    const newStatus = artwork.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED'
    try {
      await updateArtworkStatus(artwork.id, newStatus)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Artwork status could not be updated.')
    }
  }

  const remove = async (artwork: Artwork) => {
    const confirmed = window.confirm(`Delete “${artwork.title}”? All comments and engagement records for this artwork will also be permanently removed.`)
    if (!confirmed) return
    try {
      await deleteArtwork(artwork.id)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Artwork could not be deleted.')
    }
  }

  return (
    <AdminLayout
      title="Artwork collection"
      copy="Search, refine, and manage every piece in your portfolio."
      action={<Link className="button button-primary" to="/admin/artworks/new">＋ New artwork</Link>}
    >
      <form className="admin-filters" onSubmit={submitSearch}>
        <label>Search<input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Title or description" /></label>
        <label>Medium<select value={medium} onChange={(event) => setMedium(event.target.value as Medium | 'ALL')}><option value="ALL">All mediums</option>{mediums.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as Artwork['status'] | 'ALL')}><option value="ALL">All statuses</option><option value="UPLOADED">Uploaded</option><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option></select></label>
        <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently added</option><option value="title">Title</option><option value="popular">Most viewed</option></select></label>
        <button className="button button-outline" type="submit">Search</button>
      </form>
      {error && <ErrorState message={error} retry={() => void load()} />}
      {loading ? <p className="loading-inline">Gathering your collection…</p> : artworks.length ? (
        <div className="admin-artwork-list">
          {artworks.map((artwork) => (
            <article className="admin-artwork-row" key={artwork.id}>
              <img src={imageUrl(artwork.imagePath)} alt="" />
              <div className="admin-artwork-info">
                <span className={`status-pill status-${artwork.status.toLowerCase()}`}>{artwork.status.toLowerCase()}</span>
                <h2>{artwork.title}</h2><p>{artwork.medium} · {artwork.views} views · {artwork.comments} comments</p>
              </div>
              <div className="row-actions">
                <button className="button button-outline button-compact" onClick={() => navigate(`/admin/artworks/${artwork.id}/edit`)}>Edit</button>
                <button className="button button-outline button-compact" onClick={() => void changeStatus(artwork)}>{artwork.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                <button className="button button-danger button-compact" onClick={() => void remove(artwork)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty-state"><h2>No artworks match those filters.</h2><p>Try a different search, or add your next piece.</p></div>}
    </AdminLayout>
  )
}

const blankArtwork: ArtworkInput = {
  title: '',
  medium: 'Graphite',
  description: '',
  imagePath: 'face.jpg',
  status: 'UPLOADED',
}

export function ArtworkForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<ArtworkInput>(blankArtwork)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getAdminArtwork(Number(id))
      .then((artwork) => setForm({
        title: artwork.title,
        medium: artwork.medium,
        description: artwork.description,
        imagePath: artwork.imagePath,
        status: artwork.status,
      }))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Artwork could not be loaded.'))
      .finally(() => setLoading(false))
  }, [id])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveArtwork(form, id ? Number(id) : undefined)
      navigate('/admin/artworks')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Artwork could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const update = <Key extends keyof ArtworkInput>(key: Key, value: ArtworkInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <AdminLayout title={id ? 'Edit artwork' : 'Add artwork'} copy="Tell the story of this piece and choose how it appears in the collection.">
      {loading ? <p className="loading-inline">Loading artwork…</p> : (
        <form className="artwork-form panel" onSubmit={(event) => void submit(event)}>
          {error && <p className="form-error" role="alert">{error}</p>}
          <label>Title<input maxLength={120} required value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label>Medium<select value={form.medium} onChange={(event) => update('medium', event.target.value as Medium)}>{mediums.map((medium) => <option key={medium}>{medium}</option>)}</select></label>
          <label>Description<textarea rows={6} maxLength={2000} required value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
          <label>Artwork image<select value={form.imagePath} onChange={(event) => update('imagePath', event.target.value)}>
            <option value="face.jpg">Portrait study</option>
            <option value="IMG-20211204-WA0017.jpg">Birds and letters</option>
            <option value="IMG-20211204-WA0027.jpg">Yin and Yang</option>
            <option value="IMG-20211204-WA0031.jpg">Fan in bloom</option>
            <option value="armour.jpg">Armoured study</option>
          </select></label>
          <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value as ArtworkInput['status'])}>
            <option value="UPLOADED">Uploaded</option><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option>
          </select></label>
          <div className="form-actions"><Link className="button button-outline" to="/admin/artworks">Cancel</Link><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save artwork'}</button></div>
        </form>
      )}
    </AdminLayout>
  )
}

export function AdminComments() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      setComments(await getAdminComments())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Comments could not be loaded.')
    }
  }

  useEffect(() => { void load() }, [])

  const remove = async (comment: AdminComment) => {
    if (!window.confirm(`Remove this comment from “${comment.artworkTitle}”?`)) return
    try {
      await deleteComment(comment.id)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Comment could not be removed.')
    }
  }

  return (
    <AdminLayout title="Visitor comments" copy="Review notes shared by visitors across the collection.">
      {error && <ErrorState message={error} retry={() => void load()} />}
      {!error && comments.length === 0 ? <p className="empty-state">No comments have been shared yet.</p> : (
        <div className="admin-comments-list">
          {comments.map((comment) => (
            <article className="panel admin-comment" key={comment.id}>
              <div className="comment-byline"><strong>{comment.username}</strong><time>{new Date(comment.createdAt).toLocaleDateString()}</time></div>
              <p>{comment.content}</p>
              <div><Link className="text-link" to={`/artworks/${comment.artworkId}`}>{comment.artworkTitle}</Link><button className="text-button danger-text" onClick={() => void remove(comment)}>Remove</button></div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
