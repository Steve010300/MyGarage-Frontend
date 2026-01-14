import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import api from "../api";
import { getPrimaryCarImage, parseCarImages } from "../utils/cars";

export default function Favorites() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        if (!token) {
          if (mounted) setFavorites([]);
          return;
        }
        const data = await api.get("/favorites/me");
        if (mounted) setFavorites(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="page">
        <h2>Favorites</h2>
        <p>
          Please <Link to="/login">log in</Link> to view your favorites.
        </p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Loading favorites...</p>;
  if (error) return <p style={{ padding: 16, color: "#b91c1c" }}>{error}</p>;

  const remove = async (favoriteId) => {
    setError(null);
    if (!favoriteId) return;
    setRemovingId(favoriteId);
    try {
      await api.del(`/favorites/${favoriteId}`);
      setFavorites((prev) => prev.filter((f) => (f.favorite_id ?? f.id) !== favoriteId));
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="page">
      <h2>Favorites</h2>
      {favorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <div className="fav-grid">
          {favorites.map((f) => {
            // Backend returns: { favorite_id, ...cars.* }
            // Some environments may return: { id, user_id, car_id } (from POST /favorites)
            const carId = Number(f.car_id ?? f.id ?? f.car?.id);
            const car = f.car ?? f;
            const src = car?.images ? getPrimaryCarImage(parseCarImages(car.images)) : null;
            const favoriteId = f.favorite_id ?? f.id;
            return (
              <div key={favoriteId ?? `${carId}`} className="fav-card">
                <Link
                  to={Number.isFinite(carId) ? `/cars/${carId}` : "/cars"}
                  className="fav-link"
                >
                  {src ? (
                    <img src={src} alt="favorite" className="fav-image" />
                  ) : (
                    <div className="fav-image fav-image--placeholder" />
                  )}
                  <div className="fav-body">
                    <div className="fav-title">{car ? `${car.year} ${car.make} ${car.model}` : "Car"}</div>
                  </div>
                </Link>

                <button
                  type="button"
                  className="fav-remove"
                  onClick={() => remove(favoriteId)}
                  disabled={removingId === favoriteId}
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                >
                  {removingId === favoriteId ? "Removing..." : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
