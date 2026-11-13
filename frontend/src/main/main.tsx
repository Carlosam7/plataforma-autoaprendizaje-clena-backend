import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@/presentation/styles/tokens.css';
import '@/presentation/styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessibilityProvider } from '@/presentation/accessibility/AccessibilityProvider';
import { App } from '@/presentation/App';
import { container } from './container';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider useCases={container.accessibility}>
      <App />
    </AccessibilityProvider>
  </StrictMode>,
);
