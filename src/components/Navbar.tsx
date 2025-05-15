import { NavLink, useLocation } from 'react-router-dom';
import '../css/navbar.css';

export default function Navbar({ onNavClick }: { onNavClick: (path: string) => void }) {
    const location = useLocation();

    const handleClick = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        if (path !== location.pathname) {
            onNavClick(path);
        }
    };

    return (
        <nav>
            <div id="nav_container">
                <NavLink 
                    to="/" 
                    onClick={(e) => handleClick(e, "/")} 
                    className={({ isActive }) => `nav_button ${isActive ? 'active' : ''}`}
                >
                    Home
                </NavLink>
                <NavLink 
                    to="/blog" 
                    onClick={(e) => handleClick(e, "/blog")} 
                    className={({ isActive }) => `nav_button ${isActive ? 'active' : ''}`}
                >
                    Blog
                </NavLink>
                <NavLink 
                    to="/about" 
                    onClick={(e) => handleClick(e, "/about")} 
                    className={({ isActive }) => `nav_button ${isActive ? 'active' : ''}`}
                >
                    About
                </NavLink>
            </div>
        </nav>
    );
}
