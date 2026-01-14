import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import { getPrimaryCarImage, parseCarImages } from "../utils/cars";

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [me, setMe] = useState(null);

  const [car, setCar] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const [reviewEditId, setReviewEditId] = useState(null);
  const [reviewEditText, setReviewEditText] = useState("");
  const [reviewEditRating, setReviewEditRating] = useState("5");
  const [reviewEditBusyId, setReviewEditBusyId] = useState(null);
  const [reviewEditError, setReviewEditError] = useState(null);

  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);

  const imageSrc = useMemo(() => {
    if (!car) return null;
    const images = parseCarImages(car.images);
    return getPrimaryCarImage(images);
  }, [car]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      // Load current user if logged in
      if (token) {
        try {
          const meData = await api.get("/users/me");
          setMe(meData);
        } catch {
          setMe(null);
        }
      } else {
        setMe(null);
      }

      const [carData, reviewData, statsData] = await Promise.all([
        api.get(`/cars/${id}`),
        api.get(`/reviews/car/${id}`),
        api.get(`/reviews/stats/${id}`),
      ]);
      setCar(carData);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setStats(statsData);

      // Load favorite status if logged in
      if (token) {
        try {
          const favs = await api.get("/favorites/me");
          const match = Array.isArray(favs)
            ? favs.find((f) => Number(f.car_id) === Number(id) || Number(f.car?.id) === Number(id))
            : null;
          setFavoriteId(match?.favorite_id ?? match?.id ?? null);
        } catch {
          // ignore favorite load issues
          setFavoriteId(null);
        }
      } else {
        setFavoriteId(null);
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setPostError(null);

    if (!token) {
      setPostError("You must be logged in to leave a review.");
      return;
    }

    const normalizedText = reviewText.trim();
    const normalizedRating = Number(rating);
    if (!normalizedText) {
      setPostError("Please write a review.");
      return;
    }
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      setPostError("Rating must be between 1 and 5.");
      return;
    }

    setPosting(true);
    try {
      await api.post("/reviews", {
        carId: Number(id),
        review: normalizedText,
        rating: normalizedRating,
      });
      setReviewText("");
      setRating("5");
      await load();
    } catch (err) {
      setPostError(err?.message || String(err));
    } finally {
      setPosting(false);
    }
  };

  const toggleFavorite = async () => {
    setFavoriteError(null);
    if (!token) {
      setFavoriteError("Please log in to favorite cars.");
      return;
    }
    if (!car) return;

    setFavoriteBusy(true);
    try {
      if (favoriteId) {
        await api.del(`/favorites/${favoriteId}`);
        setFavoriteId(null);
      } else {
        const created = await api.post("/favorites", { carId: Number(id) });
        setFavoriteId(created?.id ?? null);
      }
    } catch (err) {
      setFavoriteError(err?.message || String(err));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const startEditReview = (r) => {
    setReviewEditError(null);
    setReviewEditId(r.id);
    setReviewEditText(String(r.review ?? ""));
    setReviewEditRating(String(r.rating ?? 5));
  };

  const cancelEditReview = () => {
    setReviewEditError(null);
    setReviewEditId(null);
    setReviewEditText("");
    setReviewEditRating("5");
  };

  const saveEditReview = async () => {
    setReviewEditError(null);
    if (!token) {
      setReviewEditError("You must be logged in.");
      return;
    }
    if (!reviewEditId) return;

    const normalizedText = reviewEditText.trim();
    const normalizedRating = Number(reviewEditRating);
    if (!normalizedText) {
      setReviewEditError("Please write a review.");
      return;
    }
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      setReviewEditError("Rating must be between 1 and 5.");
      return;
    }

    setReviewEditBusyId(reviewEditId);
    try {
      await api.patch(`/reviews/${reviewEditId}`, {
        review: normalizedText,
        rating: normalizedRating,
      });
      cancelEditReview();
      await load();
    } catch (err) {
      setReviewEditError(err?.message || String(err));
    } finally {
      setReviewEditBusyId(null);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!reviewId) return;
    const ok = window.confirm("Delete this review? This cannot be undone.");
    if (!ok) return;

    setReviewEditError(null);
    setReviewEditBusyId(reviewId);
    try {
      await api.del(`/reviews/${reviewId}`);
      if (reviewEditId === reviewId) cancelEditReview();
      await load();
    } catch (err) {
      setReviewEditError(err?.message || String(err));
    } finally {
      setReviewEditBusyId(null);
    }
  };

  const deleteCar = async () => {
    const ok = window.confirm("Delete this car? This will also remove it from your uploads.");
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      await api.del(`/cars/${id}`);
      navigate("/my-cars");
    } catch (err) {
      setError(err?.message || String(err));
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;
  if (error) return <p style={{ padding: 16, color: "#b91c1c" }}>{error}</p>;
  if (!car) return <p style={{ padding: 16 }}>Car not found.</p>;

  const ownerUsername = car.owner_username;
  const description = typeof car.description === "string" ? car.description : "";
  const isPlaceholderDescription = description.toLowerCase().startsWith("uploaded by");
  const isOwner = Boolean(me?.id) && Number(me.id) === Number(car.owner_id);

  return (
    <div className="page car-detail">
      <p>
        <Link to="/cars" className="back-link">← Back to cars</Link>
      </p>

      <div className="car-detail-header">
        <h2>
          {car.year} {car.make} {car.model}
        </h2>
        {isOwner && (
          <div className="car-detail-actions">
            <button type="button" className="action-btn" onClick={() => navigate(`/cars/${id}/edit`)}>
              Edit car
            </button>
            <button type="button" className="action-btn action-btn--danger" onClick={deleteCar}>
              Delete car
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 8px" }}>
        <button
          type="button"
          className={favoriteId ? "fav-btn fav-btn--active" : "fav-btn"}
          onClick={toggleFavorite}
          disabled={favoriteBusy}
          aria-label={favoriteId ? "Remove from favorites" : "Add to favorites"}
          title={favoriteId ? "Remove from favorites" : "Add to favorites"}
        >
          ★
        </button>
        <span style={{ opacity: 0.85 }}>
          {favoriteId ? "Saved to favorites" : "Add to favorites"}
        </span>
      </div>

      {favoriteError && <p className="upload-error">{favoriteError}</p>}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={`${car.make} ${car.model}`}
          style={{ width: "100%", maxWidth: 900, maxHeight: 420, objectFit: "cover", borderRadius: 12 }}
        />
      )}

      {ownerUsername && (
        <p style={{ maxWidth: 900, opacity: 0.85, marginTop: 12 }}>
          Uploaded by <strong>{ownerUsername}</strong>
        </p>
      )}

      {/* {(!ownerUsername || !isPlaceholderDescription) && (
        <p style={{ maxWidth: 900 }}>{description}</p>
      )} */}

      {stats && (
        <p style={{ opacity: 0.85 }}>
          Average: {Number(stats.avg_rating || 0).toFixed(1)} ★ • {Number(stats.review_count || 0)} reviews
        </p>
      )}

      <hr style={{ margin: "24px 0" }} />

      <section className="review-panel">
        <h3 className="review-title">Leave a review</h3>
        {!token && (
          <p className="upload-warn">
            Please <Link to="/login">log in</Link> to leave a review.
          </p>
        )}

        <form onSubmit={submitReview} className="upload-form" style={{ maxWidth: 900 }}>
          <div className="upload-row upload-row-actions">
            <select className="upload-select" value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">5 ★</option>
              <option value="4">4 ★</option>
              <option value="3">3 ★</option>
              <option value="2">2 ★</option>
              <option value="1">1 ★</option>
            </select>

            <input
              className="upload-input"
              value={`${car.make} ${car.model}`}
              readOnly
              aria-label="Car"
            />
          </div>

          <div className="upload-row">
            <textarea
              className="upload-textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review..."
              rows={5}
            />
          </div>

          {postError && <p className="upload-error">{postError}</p>}

          <button className="upload-submit" type="submit" disabled={posting || !token}>
            {posting ? "Posting..." : "Submit"}
          </button>
        </form>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <h3>Reviews</h3>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{r.username || "User"}</strong>
                <span>{Number(r.rating).toFixed(0)} ★</span>
              </div>

              {reviewEditId === r.id ? (
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <div className="upload-row upload-row-actions" style={{ marginTop: 0 }}>
                    <select
                      className="upload-select"
                      value={reviewEditRating}
                      onChange={(e) => setReviewEditRating(e.target.value)}
                      disabled={reviewEditBusyId === r.id}
                    >
                      <option value="5">5 ★</option>
                      <option value="4">4 ★</option>
                      <option value="3">3 ★</option>
                      <option value="2">2 ★</option>
                      <option value="1">1 ★</option>
                    </select>
                  </div>

                  <textarea
                    className="upload-textarea"
                    value={reviewEditText}
                    onChange={(e) => setReviewEditText(e.target.value)}
                    rows={4}
                    disabled={reviewEditBusyId === r.id}
                  />

                  {reviewEditError && <p className="upload-error">{reviewEditError}</p>}

                  <div className="review-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={saveEditReview}
                      disabled={reviewEditBusyId === r.id}
                    >
                      {reviewEditBusyId === r.id ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="action-btn" onClick={cancelEditReview} disabled={reviewEditBusyId === r.id}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--danger"
                      onClick={() => deleteReview(r.id)}
                      disabled={reviewEditBusyId === r.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ marginTop: 8 }}>{r.review}</p>
                  {Boolean(me?.id) && Number(r.user_id) === Number(me.id) && (
                    <div className="review-actions" style={{ marginTop: 10 }}>
                      <button type="button" className="action-btn" onClick={() => startEditReview(r)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn--danger"
                        onClick={() => deleteReview(r.id)}
                        disabled={reviewEditBusyId === r.id}
                      >
                        {reviewEditBusyId === r.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
