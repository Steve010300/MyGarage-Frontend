import { Link } from "react-router";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <img className="hero-image" src="/images/Hero.jpg" alt="hero car" loading="eager" />
        <div className="hero-content">
          <h1>Discover and review cars</h1>
          <p>Read reviews from other car enthusiasts or share your own thoughts.</p>
          <Link className="btn btn-ghost" to="/upload">Upload a car</Link>
        </div>
      </section>

      <section className="thumbs">
        <div className="thumb">
          <img src="/images/Car%202.webp" alt="car" loading="lazy" />
        </div>
        <div className="thumb">
          <img src="/images/Car%203.webp" alt="car" loading="lazy" />
        </div>
        <div className="thumb">
          <img src="/images/Car%204.webp" alt="car" loading="lazy" />
        </div>
      </section>

      {/* Bottom cards removed per request; keeping hero and thumbnails only */}
    </div>
  );
}
