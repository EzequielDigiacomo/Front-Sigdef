import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MainLayoutClub from './components/layout/MainLayoutClub';
import Login from './pages/Login';

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
import SeleccionCategoriaDetalle from './pages/EntrenadorSeleccion/SeleccionCategoriaDetalle';
import EntrenadoresList from './pages/Entrenadores/EntrenadoresList';
import UserManagement from './pages/Usuarios/UserManagement';

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

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {

    const redirectPath = user.role === 'CLUB' ? '/club' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const LoginRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (isAuthenticated) {

    const redirectPath = user.role === 'CLUB' ? '/club' : '/dashboard';
    console.log('Usuario ya autenticado, redirigiendo a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return <Login />;
};

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CLUB') {
    return <Navigate to="/club" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            { }
            <Route path="/" element={<RootRedirect />} />

            <Route path="/login" element={<LoginRoute />} />

            { }
            <Route path="/dashboard" element={
              <PrivateRoute allowedRoles={['FEDERACION']}>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />

              { }
              <Route path="atletas" element={<AtletasList />} />
              <Route path="atletas/nuevo" element={<AtletasForm />} />
              <Route path="atletas/editar/:id" element={<AtletasForm />} />

              { }
              <Route path="clubes" element={<ClubesList />} />
              <Route path="clubes/nuevo" element={<ClubesForm />} />
              <Route path="clubes/editar/:id" element={<ClubesForm />} />
              <Route path="clubes/detalles/:id" element={<ClubDetalles />} />

              { }
              <Route path="eventos" element={<EventosList />} />
              <Route path="eventos/nuevo" element={<EventosForm />} />
              <Route path="eventos/editar/:id" element={<EventosForm />} />
              <Route path="eventos/:id" element={<EventoDetalle />} />

              { }
              <Route path="tutores" element={<TutoresList />} />
              <Route path="tutores/new" element={<TutoresForm />} />
              <Route path="tutores/:id/edit" element={<TutoresForm />} />

              { }
              <Route path="inscripciones" element={<InscripcionesList />} />
              <Route path="inscripciones/new" element={<InscripcionesForm />} />

              { }
              <Route path="entrenadores" element={<EntrenadoresList />} />
              <Route path="entrenadores-seleccion" element={<EntrenadoresSeleccionList />} />
              <Route path="entrenadores-seleccion/nuevo" element={<EntrenadoresSeleccionForm />} />
              <Route path="entrenadores-seleccion/editar/:id" element={<EntrenadoresSeleccionForm />} />
              <Route path="entrenadores-seleccion/categoria/:categoryId" element={<SeleccionCategoriaDetalle />} />

              { }
              <Route path="pagos" element={<div>Página de Pagos (En construcción)</div>} />
              <Route path="federacion" element={<div>Página de Federación (En construcción)</div>} />
              <Route path="usuarios" element={<UserManagement />} />
            </Route>

            { }
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

            { }
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
