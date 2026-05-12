import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { count } = useCart();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/about', label: 'About' },
  ];

  return (
    <nav className="bg-teal-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt="Nora Hair Line" className="h-11 sm:h-14 w-auto" style={{ mixBlendMode: 'lighten' }} />
          </Link>

          {/* Nav links + Cart — always visible */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-gold-500 text-white' : 'text-white hover:bg-teal-400'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {/* Cart icon */}
            <Link to="/cart" className="relative ml-1 sm:ml-2 p-1.5 sm:p-2 text-white hover:bg-teal-400 rounded-full transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
