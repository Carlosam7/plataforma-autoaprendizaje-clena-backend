import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/presentation/layout/RootLayout';
import { AyudaPage } from '@/presentation/pages/AyudaPage';
import { CrearCuentaPage } from '@/presentation/pages/CrearCuentaPage';
import { GuiaDetallePage } from '@/presentation/pages/GuiaDetallePage';
import { GuiaPracticaPage } from '@/presentation/pages/GuiaPracticaPage';
import { GuiaResultadosPage } from '@/presentation/pages/GuiaResultadosPage';
import { GuiasPage } from '@/presentation/pages/GuiasPage';
import { HomePage } from '@/presentation/pages/HomePage';
import { IniciarSesionPage } from '@/presentation/pages/IniciarSesionPage';
import { NotFoundPage } from '@/presentation/pages/NotFoundPage';
import { ProgresoPage } from '@/presentation/pages/ProgresoPage';
import { VerificarAccesoPage } from '@/presentation/pages/VerificarAccesoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'guias',
        element: <GuiasPage />,
      },
      {
        path: 'guias/:slug',
        element: <GuiaDetallePage />,
      },
      {
        path: 'guias/:slug/practica',
        element: <GuiaPracticaPage />,
      },
      {
        path: 'guias/:slug/resultados',
        element: <GuiaResultadosPage />,
      },
      {
        path: 'mi-progreso',
        element: <ProgresoPage />,
      },
      {
        path: 'ayuda',
        element: <AyudaPage />,
      },
      {
        path: 'iniciar-sesion',
        element: <IniciarSesionPage />,
      },
      {
        path: 'registro',
        element: <CrearCuentaPage />,
      },
      {
        path: 'registro/verificar',
        element: <VerificarAccesoPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
