import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import api from "../api";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function compressImageFileToJpegDataUrl(file, { maxWidth = 900, maxHeight = 520, quality = 0.7 } = {}) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Invalid image file"));
    el.src = sourceDataUrl;
  });

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return sourceDataUrl;

  const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sourceDataUrl;
  ctx.drawImage(img, 0, 0, dstW, dstH);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      "image/jpeg",
      quality
    );
  });

  // If toBlob failed (rare), fall back.
  if (!blob) return sourceDataUrl;
  return await readFileAsDataUrl(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
}

export default function UploadCar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageNote, setImageNote] = useState("");

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const previewSrc = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (imageUrl) return imageUrl;
    return null;
  }, [imageFile, imageUrl]);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("You must be logged in to upload a car.");
      return;
    }

    const normalizedMake = make.trim();
    const normalizedModel = model.trim();
    const normalizedYear = Number(year);
    const normalizedReviewText = reviewText.trim();
    const normalizedRating = Number(rating);

    if (!normalizedMake || !normalizedModel || !year) {
      setError("Please fill out make, model, and year.");
      return;
    }

    if (!Number.isInteger(normalizedYear) || normalizedYear < 1886 || normalizedYear > new Date().getFullYear() + 1) {
      setError("Please enter a valid year.");
      return;
    }

    setLoading(true);
    try {
      let images = imageUrl.trim();
      if (imageFile) images = imageDataUrl;
      if (!images) throw new Error("Please provide an image URL or choose an image file.");

      const created = await api.post("/cars", {
        description: `Uploaded by a user.`,
        images: [images],
        make: normalizedMake,
        model: normalizedModel,
        year: normalizedYear,
      });

      if (normalizedReviewText) {
        if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
          throw new Error("Rating must be between 1 and 5.");
        }
        await api.post("/reviews", {
          carId: Number(created.id),
          review: normalizedReviewText,
          rating: normalizedRating,
        });
      }

      navigate(`/cars/${created.id}`);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("Sorry! Something went wrong")) {
        setError(
          "Upload failed. This usually means the image is too large for the server. Try a smaller image, or paste an image URL instead."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page upload-page">
      <h1 className="upload-title">Upload &amp; Review</h1>

      <div className="upload-card">
        <div className="upload-image">
          {previewSrc ? (
            <img src={previewSrc} alt="car preview" />
          ) : (
            <div className="upload-image-placeholder" />
          )}

          <button
            type="button"
            className="upload-photo-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload photo
          </button>

          <input
            ref={fileInputRef}
            className="upload-file"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0] ?? null;
              setError(null);
              setImageNote("");
              setImageFile(f);
              setImageDataUrl("");
              if (!f) return;
              setImageUrl("");
              try {
                // Aggressive compression to avoid backend payload limits.
                const compressed = await compressImageFileToJpegDataUrl(f, {
                  maxWidth: 640,
                  maxHeight: 360,
                  quality: 0.65,
                });
                setImageDataUrl(compressed);
                const approxBytes = Math.round((compressed.length * 3) / 4);
                setImageNote(`Compressed image ~${Math.round(approxBytes / 1024)} KB`);
              } catch (err) {
                setError(err?.message || String(err));
              }
            }}
          />
        </div>
      </div>

      {!token && (
        <p className="upload-warn">
          You’re not logged in. Please log in first.
        </p>
      )}

      <form onSubmit={onSubmit} className="upload-form">
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
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review... (optional)"
            rows={5}
          />
        </div>

        <div className="upload-row upload-row-actions">
          <select className="upload-select" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="5">5 ★</option>
            <option value="4">4 ★</option>
            <option value="3">3 ★</option>
            <option value="2">2 ★</option>
            <option value="1">1 ★</option>
          </select>

          <input
            className="upload-input upload-url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (e.target.value) setImageFile(null);
              if (e.target.value) setImageDataUrl("");
              if (e.target.value) setImageNote("");
            }}
            placeholder="Or paste an image URL (optional)"
          />
        </div>

        {imageNote && <p className="upload-note">{imageNote}</p>}

        {error && <p className="upload-error">{error}</p>}

        <button className="upload-submit" disabled={loading || !token} type="submit">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
