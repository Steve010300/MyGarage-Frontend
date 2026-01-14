import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import { getPrimaryCarImage, parseCarImages } from "../utils/cars";

export default function EditCar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const previewSrc = useMemo(() => {
    const normalizedUrl = imageUrl.trim();
    if (normalizedUrl) return normalizedUrl;
    if (!car) return null;
    const images = parseCarImages(car.images);
    return getPrimaryCarImage(images) || null;
  }, [car, imageUrl]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        if (!token) {
          setError("You must be logged in to edit a car.");
          return;
        }

        const carData = await api.get(`/cars/${id}`);
        if (!mounted) return;

        setCar(carData);
        setMake(String(carData?.make ?? ""));
        setModel(String(carData?.model ?? ""));
        setYear(String(carData?.year ?? ""));
        setDescription(String(carData?.description ?? ""));

        const images = parseCarImages(carData?.images);
        const primary = getPrimaryCarImage(images);
        setImageUrl(primary || "");
      } catch (err) {
        if (mounted) setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, token]);

  const onSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("You must be logged in to edit a car.");
      return;
    }

    const normalizedMake = make.trim();
    const normalizedModel = model.trim();
    const normalizedYear = Number(year);
    const normalizedDescription = description.trim();
    const normalizedImageUrl = imageUrl.trim();

    if (!normalizedMake || !normalizedModel || !year) {
      setError("Please fill out make, model, and year.");
      return;
    }

    if (!Number.isInteger(normalizedYear) || normalizedYear < 1886 || normalizedYear > new Date().getFullYear() + 1) {
      setError("Please enter a valid year.");
      return;
    }

    if (!normalizedImageUrl) {
      setError("Please provide an image URL.");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/cars/${id}`, {
        description: normalizedDescription,
        images: [normalizedImageUrl],
        make: normalizedMake,
        model: normalizedModel,
        year: normalizedYear,
      });
      navigate(`/cars/${id}`);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="page">
        <h2>Edit Car</h2>
        <p>
          Please <Link to="/login">log in</Link> to edit a car.
        </p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Loading car...</p>;
  if (error) return <p style={{ padding: 16, color: "#ffb3b3" }}>{error}</p>;
  if (!car) return <p style={{ padding: 16 }}>Car not found.</p>;

  return (
    <div className="page upload-page">
      <p>
        <Link to={`/cars/${id}`} className="back-link">← Back to car</Link>
      </p>

      <h1 className="upload-title">Edit Car</h1>

      <div className="upload-card">
        <div className="upload-image">
          {previewSrc ? (
            <img src={previewSrc} alt="car" />
          ) : (
            <div className="upload-image-placeholder" />
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="upload-form">
        <div className="upload-row">
          <input
            className="upload-input"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Make"
            autoComplete="off"
          />
          <input
            className="upload-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            autoComplete="off"
          />
          <input
            className="upload-input upload-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            inputMode="numeric"
          />
        </div>

        <div className="upload-row">
          <textarea
            className="upload-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={4}
          />
        </div>

        <div className="upload-row">
          <input
            className="upload-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
          />
        </div>

        {error && <p className="upload-error">{error}</p>}

        <button className="upload-submit" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
