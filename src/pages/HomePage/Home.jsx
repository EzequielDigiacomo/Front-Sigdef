import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchGlobalMetrics, fetchPlanes } from '../../services/saasService';
import { applyCatalogPrices } from '../../utils/plansCatalogDisplay';
import { plansDataBase } from './sections/plansData';
import HomeHeader from './sections/HomeHeader';
import HomeHero from './sections/HomeHero';
import HomeAppNativa from './sections/HomeAppNativa';
import HomePlanes from './sections/HomePlanes';
import HomeContacto from './sections/HomeContacto';
import HomeFooter from './sections/HomeFooter';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalFederaciones: 8,
    totalClubes: 124,
    totalAtletas: 4850,
  });
  const [selectedTab, setSelectedTab] = useState('sigdef');
  const [nivelInteres, setNivelInteres] = useState('');
  const [plansData, setPlansData] = useState(plansDataBase);

  useEffect(() => {
    fetchGlobalMetrics()
      .then((data) => {
        if (data) {
          setMetrics({
            totalFederaciones: data.totalFederaciones || 8,
            totalClubes: data.totalClubes || 124,
            totalAtletas: data.totalAtletas || 4850,
          });
        }
      })
      .catch((err) => console.warn('Usando métricas locales de fallback:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPlanes()
      .then((planes) => {
        if (!cancelled) setPlansData(applyCatalogPrices(plansDataBase, planes));
      })
      .catch((err) => {
        console.warn('No se pudieron cargar precios del catálogo; se usan valores locales.', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectNivel = (nivel) => {
    setNivelInteres(nivel);
    setTimeout(() => {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAccess = () => {
    if (isAuthenticated) {
      const redirectPath = user.role === 'CLUB' ? '/club' : user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard';
      navigate(redirectPath);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page fade-in">
      <HomeHeader isAuthenticated={isAuthenticated} onAccess={handleAccess} onLogoClick={() => navigate('/')} />
      <HomeHero metrics={metrics} onAccess={handleAccess} />
      <HomeAppNativa />
      <HomePlanes
        plansData={plansData}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        onSelectNivel={selectNivel}
        tabs={['sigdef', 'duo']}
      />
      <HomeContacto nivelInteres={nivelInteres} setNivelInteres={setNivelInteres} />
      <HomeFooter onAccess={handleAccess} />
    </div>
  );
};

export default Home;
