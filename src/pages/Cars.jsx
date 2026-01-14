import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import { getPrimaryCarImage, parseCarImages } from "../utils/cars";

export default function Cars() {
  const { token } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [favoriteByCarId, setFavoriteByCarId] = useState({});
  const [favoriteBusyCarId, setFavoriteBusyCarId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await api.get("/cars/stats");
        if (mounted) setCars(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) {
          if (mounted) setFavoriteByCarId({});
          return;
        }
        const favs = await api.get("/favorites/me");
        const next = {};
        if (Array.isArray(favs)) {
          for (const f of favs) {
            // /favorites/me returns { favorite_id, ...cars.* }
            if (f?.favorite_id != null && f?.id != null) next[Number(f.id)] = { id: f.favorite_id, car_id: f.id };
            else if (f?.car_id != null && f?.id != null) next[Number(f.car_id)] = f;
            else if (f?.car?.id != null) next[Number(f.car.id)] = f;
          }
        }
        if (mounted) setFavoriteByCarId(next);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const toggleFavorite = async (e, carId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setError("Please log in to favorite cars.");
      return;
    }

    setFavoriteBusyCarId(carId);
    try {
      const existing = favoriteByCarId[carId];
      if (existing?.id) {
        await api.del(`/favorites/${existing.id}`);
        setFavoriteByCarId((prev) => {
          const next = { ...prev };
          delete next[carId];
          return next;
        });
      } else {
        const created = await api.post("/favorites", { carId });
        setFavoriteByCarId((prev) => ({ ...prev, [carId]: created }));
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setFavoriteBusyCarId(null);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading cars...</p>;
  if (error) return <p style={{ padding: 16, color: "#b91c1c" }}>{error}</p>;

  return (
    <div className="page">
      <h2>Cars</h2>

      {cars.length === 0 ? (
        <p>No cars yet. Try uploading one.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {cars.map((car) => {
            const images = parseCarImages(car.images);
            const src = getPrimaryCarImage(images);
            const isFav = Boolean(favoriteByCarId[Number(car.id)]);
            return (
              <Link
                key={car.id}
                to={`/cars/${car.id}`}
                style={{ textDecoration: "none", color: "inherit", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", position: "relative" }}
              >
                {token && (
                  <button
                    type="button"
                    className={isFav ? "fav-btn fav-btn--active" : "fav-btn"}
                    onClick={(e) => toggleFavorite(e, Number(car.id))}
                    disabled={favoriteBusyCarId === Number(car.id)}
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}
                    aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    ★
                  </button>
                )}
                {src ? (
                  <img src={src} alt={`${car.make} ${car.model}`} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 160, background: "#f3f4f6" }} />
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700 }}>
                    {car.year} {car.make} {car.model}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
                    {Number(car.review_count || 0)} reviews • {Number(car.avg_rating || 0).toFixed(1)} ★
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
