import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MainLayoutClub from './components/layout/MainLayoutClub';
import Login from './pages/Login';

// Páginas de Federación
import Dashboard from './pages/Dashboard';
import AtletasList from './pages/Atletas/AtletasList';
import AtletasForm from './pages/Atletas/AtletasForm';
import ClubesList from './pages/Clubes/ClubesList';
import ClubesForm from './pages/Clubes/ClubesForm';
import ClubDetalles from './pages/Clubes/ClubDetalles';
import EventosList from './pages/Eventos/EventosList';
import EventosForm from './pages/Eventos/EventosForm';
import EventoDetalle from './pages/Eventos/EventoDetalle';
import TutoresList from './pages/Tutores/TutoresList';
import TutoresForm from './pages/Tutores/TutoresForm';
import InscripcionesList from './pages/Inscripciones/InscripcionesList';
import InscripcionesForm from './pages/Inscripciones/InscripcionesForm';
import EntrenadoresSeleccionList from './pages/EntrenadorSeleccion/EntrenadorSeleccionList';
import EntrenadoresSeleccionForm from './pages/EntrenadorSeleccion/EntrenadorSeleccionForm';

// Páginas de Club
import ClubDashboard from './pages/Club/ClubDashboard';
import ClubInfo from './pages/Club/ClubInfo';
import ClubAtletas from './pages/Club/ClubAtletas';
import ClubAtletasForm from './pages/Club/ClubAtletasForm';
import ClubTutores from './pages/Club/ClubTutores';
import ClubTutoresForm from './pages/Club/ClubTutoresForm';
import ClubEventos from './pages/Club/ClubEventos';
import ClubEventosForm from './pages/Club/ClubEventosForm';
import EventosDisponibles from './pages/Club/EventosDisponibles';
import ClubEntrenadores from './pages/Club/ClubEntrenadores';
import ClubEntrenadoresForm from './pages/Club/ClubEntrenadoresForm';
import ClubDelegados from './pages/Club/ClubDelegados';
import ClubDelegadosForm from './pages/Club/ClubDelegadosForm';

import { ThemeProvider } from './context/ThemeContext';

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir al dashboard correspondiente según el rol
    const redirectPath = user.role === 'CLUB' ? '/club' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Componente para redirigir según el rol del usuario
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (user.role === 'CLUB') {
    return <Navigate to="/club" replace />;
  }

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rutas de Federación (Administrador) */}
            <Route path="/" element={
              <PrivateRoute allowedRoles={['FEDERACION']}>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />

              {/* Rutas de Atletas */}
              <Route path="atletas" element={<AtletasList />} />
              <Route path="atletas/nuevo" element={<AtletasForm />} />
              <Route path="atletas/editar/:id" element={<AtletasForm />} />

              {/* Rutas de Clubes */}
              <Route path="clubes" element={<ClubesList />} />
              <Route path="clubes/nuevo" element={<ClubesForm />} />
              <Route path="clubes/editar/:id" element={<ClubesForm />} />
              <Route path="clubes/detalles/:id" element={<ClubDetalles />} />

              {/* Rutas de Eventos */}
              <Route path="eventos" element={<EventosList />} />
              <Route path="eventos/nuevo" element={<EventosForm />} />
              <Route path="eventos/editar/:id" element={<EventosForm />} />
              <Route path="eventos/:id" element={<EventoDetalle />} />

              {/* Rutas de Tutores */}
              <Route path="tutores" element={<TutoresList />} />
              <Route path="tutores/new" element={<TutoresForm />} />
              <Route path="tutores/:id/edit" element={<TutoresForm />} />

              {/* Rutas de Inscripciones */}
              <Route path="inscripciones" element={<InscripcionesList />} />
              <Route path="inscripciones/new" element={<InscripcionesForm />} />

              {/* Rutas de Entrenadores de Selección */}
              <Route path="entrenadores-seleccion" element={<EntrenadoresSeleccionList />} />
              <Route path="entrenadores-seleccion/nuevo" element={<EntrenadoresSeleccionForm />} />
              <Route path="entrenadores-seleccion/editar/:id" element={<EntrenadoresSeleccionForm />} />

              {/* Rutas de Pagos */}
              <Route path="pagos" element={<div>Página de Pagos (En construcción)</div>} />
              <Route path="federacion" element={<div>Página de Federación (En construcción)</div>} />
            </Route>

            {/* Rutas de Club */}
            <Route path="/club" element={
              <PrivateRoute allowedRoles={['CLUB']}>
                <MainLayoutClub />
              </PrivateRoute>
            }>
              <Route index element={<ClubDashboard />} />
              <Route path="info" element={<ClubInfo />} />
              <Route path="atletas" element={<ClubAtletas />} />
              <Route path="atletas/nuevo" element={<ClubAtletasForm />} />
              <Route path="atletas/editar/:id" element={<ClubAtletasForm />} />
              <Route path="tutores" element={<ClubTutores />} />
              <Route path="tutores/nuevo" element={<ClubTutoresForm />} />
              <Route path="tutores/editar/:id" element={<ClubTutoresForm />} />
              <Route path="eventos" element={<ClubEventos />} />
              <Route path="eventos/nuevo" element={<ClubEventosForm />} />
              <Route path="eventos/editar/:id" element={<ClubEventosForm />} />
              <Route path="eventos-disponibles" element={<EventosDisponibles />} />
              <Route path="entrenadores" element={<ClubEntrenadores />} />
              <Route path="entrenadores/nuevo" element={<ClubEntrenadoresForm />} />
              <Route path="entrenadores/editar/:id" element={<ClubEntrenadoresForm />} />
              <Route path="delegados" element={<ClubDelegados />} />
              <Route path="delegados/nuevo" element={<ClubDelegadosForm />} />
              <Route path="delegados/editar/:id" element={<ClubDelegadosForm />} />
              <Route path="inscripciones/nuevo" element={<InscripcionesForm />} />
            </Route>

            {/* Ruta por defecto - redirige según el rol */}
            <Route path="*" element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
