import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  addComment,
  getArtwork,
  getPublicArtworks,
  imageUrl,
  reactToArtwork,
  recordView,
} from '../api'
import { useAuth } from '../AuthContext'
import { selectSessionSamples } from '../sample-selection'
import { mediums, type Artwork, type Medium, type ReactionType } from '../types'

function PageIntro({
  label,
  title,
  copy,
}: {
  label: string
  title: string
  copy: string
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  )
}

function ArtworkCard({
  artwork,
  featured = false,
}: {
  artwork: Artwork
  featured?: boolean
}) {
  return (
    <article
      className={`artwork-card ${featured ? 'artwork-card-featured' : ''}`}
    >
      <Link
        className="artwork-image"
        to={`/artworks/${artwork.id}`}
        aria-label={`View ${artwork.title}`}
      >
        <img
          src={imageUrl(artwork.imagePath)}
          alt={artwork.title}
          loading="lazy"
        />
      </Link>
      <div className="artwork-card-body">
        <div className="artwork-meta-row">
          <span className="artwork-medium">{artwork.medium}</span>
          <span className="view-count">{artwork.views} views</span>
        </div>
        <h2>
          <Link to={`/artworks/${artwork.id}`}>{artwork.title}</Link>
        </h2>
        <p className="artwork-summary">{artwork.description}</p>
        {artwork.commentSnippets[0] && (
          <blockquote className="sample-comment">
            “{artwork.commentSnippets[0].content}”
          </blockquote>
        )}
        <Link className="text-link" to={`/artworks/${artwork.id}`}>
          Explore artwork <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="inline-error" role="alert">
      <span>{message}</span>
      <button className="text-button" onClick={retry}>
        Try again
      </button>
    </div>
  )
}

export function LandingPage() {
  const [samples, setSamples] = useState<Artwork[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const results = await getPublicArtworks({ sort: 'recent' })
      setSamples(selectSessionSamples(results, window.sessionStorage))
      setError(null)
      setError(null)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load the gallery.',
      )
    }
  }

  useEffect(() => {
    let active = true
    getPublicArtworks({ sort: 'recent' })
      .then((results) => {
        if (!active) return
        setSamples(selectSessionSamples(results, window.sessionStorage))
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load the gallery.',
        )
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">A collection of original work</p>
          <h1>Quiet study in form, memory, and light.</h1>
          <p className="landing-description">
            Explore drawings, paintings, and small moments captured in line and
            colour. Browse freely; sign in only when you want to leave a
            response.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/gallery">
              View the collection
            </Link>
            <a className="button button-soft" href="#featured">
              A few selected works
            </a>
          </div>
        </div>
        <div className="landing-feature">
          {samples[0] ? (
            <Link to={`/artworks/${samples[0].id}`}>
              <img
                src={imageUrl(samples[0].imagePath)}
                alt={samples[0].title}
              />
              <span className="feature-caption">
                <small>Featured study</small>
                <strong>{samples[0].title}</strong>
              </span>
            </Link>
          ) : (
            <div className="feature-placeholder">Artwork will appear here</div>
          )}
        </div>
      </section>

      <aside className="signin-note">
        <span>
          <strong>Browse freely.</strong> Sign in only when you want to like,
          dislike, or leave a comment.
        </span>
        <Link className="button button-outline" to="/signup">
          Sign in to interact
        </Link>
      </aside>

      <section className="content-section" id="featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A rotating selection</p>
            <h2>Three works to begin with</h2>
            <p>
              Selected from a small collection of five, with a note from a
              visitor.
            </p>
          </div>
          <Link className="text-link" to="/gallery">
            Browse all artworks <span aria-hidden="true">→</span>
          </Link>
        </div>
        {error && <LoadError message={error} retry={() => void load()} />}
        {samples.length > 0 ? (
          <div className="artwork-grid sample-grid">
            {samples.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : !error ? (
          <p className="empty-note">
            The public collection is waiting for its first published pieces.
          </p>
        ) : null}
      </section>

      <section className="medium-strip" aria-label="Browse by medium">
        <div>
          <p className="eyebrow">Explore by medium</p>
          <h2>Find your own way in.</h2>
        </div>
        <div className="medium-links">
          {mediums.map((medium, index) => (
            <Link
              className={`medium-chip medium-chip-${index + 1}`}
              key={medium}
              to={`/gallery?medium=${encodeURIComponent(medium)}`}
            >
              {medium}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export function GalleryPage() {
  const location = useLocation()
  const initialMedium = new URLSearchParams(location.search).get('medium')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [medium, setMedium] = useState<Medium | 'ALL'>(() =>
    initialMedium && mediums.includes(initialMedium as Medium)
      ? (initialMedium as Medium)
      : 'ALL',
  )
  const [sort, setSort] = useState('recent')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let active = true
    getPublicArtworks({ medium, sort, search })
      .then((results) => {
        if (active) {
          setArtworks(results)
          setError(null)
        }
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Could not load the gallery.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [medium, search, sort, refreshCount])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const nextSearch = searchInput.trim()
    if (nextSearch !== search) setLoading(true)
    setSearch(nextSearch)
  }

  return (
    <main className="page-content">
      <PageIntro
        label="The collection"
        title="Artworks"
        copy="Take your time. Each piece has a story, a material, and a place of its own."
      />
      <div className="gallery-toolbar">
        <div className="filter-chips" aria-label="Filter by medium">
          <button
            className={`filter-chip ${medium === 'ALL' ? 'active' : ''}`}
            onClick={() => {
              if (medium !== 'ALL') setLoading(true)
              setMedium('ALL')
            }}
          >
            All work
          </button>
          {mediums.map((item, index) => (
            <button
              key={item}
              className={`filter-chip filter-chip-${index + 1} ${medium === item ? 'active' : ''}`}
              onClick={() => {
                if (medium !== item) setLoading(true)
                setMedium(item)
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <form className="gallery-search" onSubmit={submitSearch}>
          <label className="visually-hidden" htmlFor="gallery-search">
            Search artworks
          </label>
          <input
            id="gallery-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title or description"
          />
          <button className="button button-outline" type="submit">
            Search
          </button>
        </form>
        <label className="sort-control">
          Sort
          <select
            value={sort}
            onChange={(event) => {
              if (sort !== event.target.value) setLoading(true)
              setSort(event.target.value)
            }}
          >
            <option value="recent">Recently added</option>
            <option value="title">Title</option>
            <option value="popular">Most viewed</option>
          </select>
        </label>
      </div>
      {error && (
        <LoadError
          message={error}
          retry={() => {
            setLoading(true)
            setRefreshCount((value) => value + 1)
          }}
        />
      )}
      {loading ? (
        <p className="loading-inline" aria-live="polite">
          Gathering the collection…
        </p>
      ) : artworks.length ? (
        <div className="artwork-grid">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">A quiet corner</p>
          <h2>No artworks found.</h2>
          <p>Try a different medium or search term.</p>
        </div>
      )}
    </main>
  )
}

export function ArtworkDetailPage() {
  const { id } = useParams()
  const { account } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const artworkId = Number(id)
  const validArtworkId = Number.isInteger(artworkId) && artworkId > 0

  useEffect(() => {
    if (!validArtworkId) return
    let active = true
    getArtwork(artworkId)
      .then((result) => {
        if (!active) return
        setError(null)
        setArtwork(result)
        return recordView(artworkId)
          .then(() => getArtwork(artworkId))
          .then((updated) => {
            if (active) setArtwork(updated)
          })
          .catch((requestError: unknown) => {
            if (active)
              setViewError(
                requestError instanceof Error
                  ? requestError.message
                  : 'View could not be recorded.',
              )
          })
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'This artwork could not be loaded.',
          )
      })
    return () => {
      active = false
    }
  }, [artworkId, validArtworkId])

  const requireSignIn = () => {
    navigate(
      `/signin?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
    )
  }

  const react = async (reaction: ReactionType) => {
    if (!account) {
      requireSignIn()
      return
    }
    if (!artwork) return
    setBusy(true)
    setError(null)
    try {
      setArtwork(await reactToArtwork(artwork.id, reaction))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Your reaction could not be saved.',
      )
    } finally {
      setBusy(false)
    }
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!account) {
      requireSignIn()
      return
    }
    if (!artwork) return
    setBusy(true)
    setError(null)
    try {
      await addComment(artwork.id, comment)
      setComment('')
      setArtwork(await getArtwork(artwork.id))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Your comment could not be saved.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!validArtworkId) {
    return (
      <main className="narrow-page empty-state">
        <p role="alert">This artwork could not be found.</p>
        <Link className="button button-outline" to="/gallery">
          Back to gallery
        </Link>
      </main>
    )
  }
  if (error && !artwork) {
    return (
      <main className="narrow-page empty-state">
        <p role="alert">{error}</p>
        <Link className="button button-outline" to="/gallery">
          Back to gallery
        </Link>
      </main>
    )
  }
  if (!artwork) return <main className="loading-screen">Opening artwork…</main>

  return (
    <main className="detail-page">
      <Link className="back-link" to="/gallery">
        ← Back to gallery
      </Link>
      <section className="detail-hero">
        <div className="detail-image">
          <img src={imageUrl(artwork.imagePath)} alt={artwork.title} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{artwork.medium}</p>
          <h1>{artwork.title}</h1>
          <p className="detail-description">{artwork.description}</p>
          <div className="detail-stats">
            <span>
              <strong>{artwork.views}</strong> views
            </span>
            <span>
              <strong>{artwork.likes}</strong> likes
            </span>
            <span>
              <strong>{artwork.dislikes}</strong> dislikes
            </span>
            <span>
              <strong>{artwork.comments}</strong> comments
            </span>
          </div>
          <div className="reaction-actions">
            <button
              className={`button ${artwork.myReaction === 'LIKE' ? 'button-primary' : 'button-outline'}`}
              onClick={() => void react('LIKE')}
              disabled={busy}
            >
              ♡ Like
            </button>
            <button
              className={`button ${artwork.myReaction === 'DISLIKE' ? 'button-primary' : 'button-outline'}`}
              onClick={() => void react('DISLIKE')}
              disabled={busy}
            >
              Dislike
            </button>
          </div>
          {!account && (
            <p className="interaction-hint">
              Sign in to like, dislike, or leave a comment.{' '}
              <button className="text-button" onClick={requireSignIn}>
                Sign in
              </button>
            </p>
          )}
          {viewError && (
            <p className="inline-error" role="alert">
              {viewError}
            </p>
          )}
        </div>
      </section>

      <section className="comments-section">
        <div className="comments-heading">
          <div>
            <p className="eyebrow">Conversation</p>
            <h2>Notes from visitors</h2>
          </div>
          <span className="comment-count">{artwork.comments}</span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {artwork.commentSnippets.length ? (
          <div className="comment-list">
            {artwork.commentSnippets.map((item) => (
              <article className="comment-card" key={item.id}>
                <div className="comment-byline">
                  <strong>{item.username}</strong>
                  <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                </div>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">
            There are no notes here yet. Be the first to share one.
          </p>
        )}
        <form
          className="comment-form"
          onSubmit={(event) => void submitComment(event)}
        >
          <label htmlFor="new-comment">Leave a note</label>
          <textarea
            id="new-comment"
            rows={4}
            maxLength={1000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What caught your eye?"
            required
          />
          <button
            className="button button-primary"
            disabled={busy || !comment.trim()}
            type="submit"
          >
            {account ? 'Post comment' : 'Sign in to comment'}
          </button>
        </form>
      </section>
    </main>
  )
}
