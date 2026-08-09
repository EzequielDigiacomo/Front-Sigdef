import { Mail, Smartphone } from 'lucide-react';

export default function HomeFooter({ onAccess }) {
  return (
    <footer className="home-footer-premium">
      <div className="home-container footer-content">
        <div className="footer-main-info">
          <div className="footer-logo">
            <img src="/logo_icon.png" alt="SIGDEF" style={{ height: '36px' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }} className="text-gradient-green">
              SIGDEF
            </span>
          </div>
          <p className="footer-company-desc">
            SaaS de digitalización federativa oficial. Llevando el control administrativo, aptos médicos y padrones del canotaje nacional a una plataforma ágil y transparente.
          </p>
          <div className="footer-developer">
            Tecnología oficial en integración con <span>SportTrack</span>
          </div>
        </div>

        <div className="footer-column">
          <h4>Contacto</h4>
          <div className="footer-links">
            <a href="mailto:soporte@sigdef.com" className="footer-link">
              <Mail size={16} style={{ marginRight: '4px' }} /> soporte@sigdef.com
            </a>
            <a href="https://wa.me/5493412280901" className="footer-link">
              <Smartphone size={16} style={{ marginRight: '4px' }} /> WhatsApp Soporte
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h4>Enlaces Rápidos</h4>
          <div className="footer-links">
            <span className="footer-link" style={{ cursor: 'pointer' }} onClick={onAccess}>
              Acceso Staff / Clubs
            </span>
            <a href="#app-celular" className="footer-link">
              App de Celular
            </a>
            <a href="#planes" className="footer-link">
              Planes de Pago
            </a>
            <a href="#contacto" className="footer-link">
              Contacto
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="home-container">
          <p>© 2026 SIGDEF · Sistema de Gestión Deportiva Federativa · Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}
