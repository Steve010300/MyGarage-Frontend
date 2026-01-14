export function parseCarImages(images) {
  if (!images) return [];

  if (Array.isArray(images)) return images.filter(Boolean);

  if (typeof images === "string") {
    const trimmed = images.trim();
    if (!trimmed) return [];

    // If it's already a url/data-url, treat as single image.
    if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return [trimmed];

    // Otherwise try JSON array.
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // ignore
    }

    return [trimmed];
  }

  return [];
}

export function getPrimaryCarImage(images) {
  if (!images || images.length === 0) return null;
  return images[0] || null;
}
