import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md">
      <div className="max-w-4xl mx-auto flex space-x-6">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/blog" className="hover:underline">Blog</Link>
        <Link to="/about" className="hover:underline">About</Link>
      </div>
    </nav>
  )
}