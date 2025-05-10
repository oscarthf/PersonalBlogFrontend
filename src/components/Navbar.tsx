import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav>
      <div id="nav_container">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/blog" className="hover:underline">Blog</Link>
        <Link to="/about" className="hover:underline">About</Link>
      </div>
    </nav>
  )
}