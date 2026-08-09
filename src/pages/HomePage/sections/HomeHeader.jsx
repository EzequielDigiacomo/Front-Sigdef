import { ArrowRight, LogIn } from 'lucide-react';

export default function HomeHeader({ isAuthenticated, onAccess, onLogoClick }) {
  return (
    <header className="home-header">
      <div className="logo-container" onClick={onLogoClick}>
        <img src="/logo_icon.png" alt="SIGDEF Logo" className="logo-img" />
        <span style={{ fontSize: '1.45rem', fontWeight: 850, letterSpacing: '-0.5px' }} className="text-gradient-green">
          SIGDEF
        </span>
      </div>
      <div>
        <button onClick={onAccess} className="btn-acc-green" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
          {isAuthenticated ? (
            <>
              Ir a mi Panel <ArrowRight size={16} />
            </>
          ) : (
            <>
              Iniciar Sesión <LogIn size={16} />
            </>
          )}
        </button>
      </div>
    </header>
  );
}
