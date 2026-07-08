import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { Shield, Users, CreditCard, Smartphone, CheckCircle, ArrowRight, Building, Award, LogIn } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleAccess = () => {
    if (isAuthenticated) {
      const redirectPath = user.role === 'CLUB' ? '/club' : (user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
      navigate(redirectPath);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'var(--transition)'
    }}>
      {/* ── NAVBAR SUPERIOR ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: 'var(--glass-border)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo_icon.png" alt="SIGDEF Logo" style={{ height: '40px', width: 'auto' }} />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-gradient">
            SIGDEF
          </span>
        </div>
        <div>
          <Button onClick={handleAccess} variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated ? (
              <>
                Ir a mi Panel <ArrowRight size={16} />
              </>
            ) : (
              <>
                Iniciar Sesión <LogIn size={16} />
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '9999px',
          padding: '0.35rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--primary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Portal de Administración Oficial
        </div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          margin: 0
        }}>
          Gestión Institucional de <span style={{ color: 'var(--primary)' }}>Federaciones</span>
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '700px',
          margin: '0.5rem 0 1.5rem'
        }}>
          Digitalice y centralice el control de su entidad deportiva. Gestione padrones de atletas, apruebe legajos descentralizados desde los clubes y administre sus aranceles en un entorno seguro y profesional.
        </p>
        <div>
          <Button onClick={handleAccess} variant="primary" size="lg" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated ? 'Ingresar al Dashboard' : 'Acceder al Sistema'} <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* ── MÓDULOS / CARACTERÍSTICAS PRINCIPALES ── */}
      <section style={{
        padding: '3rem 2rem 6rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Módulos del Sistema
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Todo lo necesario para el control integral de la federación.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1: Padrón */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, alignSelf: 'flex-start', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Padrón Federativo Único</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Base de datos unificada de atletas, entrenadores, tutores legales y delegados con categorización automática por edad.
            </p>
          </div>

          {/* Card 2: Gestión Descentralizada */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, alignSelf: 'flex-start', justifyContent: 'center' }}>
              <Building size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Doble Dashboard (Federación / Club)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Permite la carga descentralizada de datos. Cada club afiliado administra sus deportistas y los envía a validar por la federación.
            </p>
          </div>

          {/* Card 3: Documentación */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, alignSelf: 'flex-start', justifyContent: 'center' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Validación y Aprobación Online</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Flujo digital para revisar aptos médicos, DNI, seguros y credenciales. Evite planillas físicas e inconsistencias de datos.
            </p>
          </div>

          {/* Card 4: Pagos y Aranceles */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #a855f7' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, alignSelf: 'flex-start', justifyContent: 'center' }}>
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Matrículas y Afiliación</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Módulo de cobros y control de estado de pagos para asegurar que solo los deportistas habilitados participen en las regatas oficiales.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER DE LA PLATAFORMA ── */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: 'var(--glass-border)',
        padding: '2rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ margin: 0 }}>
            © 2026 SIGDEF · Sistema de Gestión Deportiva Federativa · Todos los derechos reservados
          </p>
          <p style={{ margin: 0 }}>
            Tecnología oficial en integración con <span style={{ color: 'var(--primary)', fontWeight: 600 }}>SportTrack</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
