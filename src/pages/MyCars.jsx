import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import api from "../api";
import { getPrimaryCarImage, parseCarImages } from "../utils/cars";

export default function MyCars() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        if (!token) {
          if (mounted) setCars([]);
          return;
        }
        const data = await api.get("/cars/me");
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
  }, [token]);

  if (!token) {
    return (
      <div className="page">
        <h2>My Cars</h2>
        <p>
          Please <Link to="/login">log in</Link> to view your uploads.
        </p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Loading your cars...</p>;
  if (error) return <p style={{ padding: 16, color: "#ffb3b3" }}>{error}</p>;

  const onDelete = async (carId) => {
    if (!carId) return;
    const ok = window.confirm("Delete this car? This cannot be undone.");
    if (!ok) return;

    setError(null);
    setDeletingId(carId);
    try {
      await api.del(`/cars/${carId}`);
      setCars((prev) => prev.filter((c) => c.id !== carId));
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page mycars-page">
      <h1 className="mycars-title">My Cars</h1>

      {cars.length === 0 ? (
        <div className="mycars-empty">
          <p>You haven’t uploaded any cars yet.</p>
          <Link className="btn btn-primary" to="/upload">
            Upload your first car
          </Link>
        </div>
      ) : (
        <div className="mycars-list">
          {cars.map((car) => {
            const src = getPrimaryCarImage(parseCarImages(car.images));
            return (
              <div key={car.id} className="mycar-row">
                <Link to={`/cars/${car.id}`} className="mycar-link" aria-label={`View ${car.make} ${car.model}`}>
                  <div className="mycar-image">
                    {src ? <img src={src} alt={`${car.make} ${car.model}`} /> : <div className="mycar-image-placeholder" />}
                  </div>
                  <div className="mycar-body">
                    <h3 className="mycar-name">
                      {car.make} {car.model}
                    </h3>
                    {/* <p className="mycar-desc">{car.description || ""}</p> */}
                  </div>
                </Link>

                <div className="mycar-actions">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => navigate(`/cars/${car.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn--danger"
                    onClick={() => onDelete(car.id)}
                    disabled={deletingId === car.id}
                  >
                    {deletingId === car.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
