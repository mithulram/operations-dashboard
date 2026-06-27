import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminKeyProvider } from '../src/context/AdminKeyContext';

interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(ui: ReactElement, options: RenderAppOptions = {}) {
  const { route = '/', ...renderOptions } = options;

  return render(
    <AdminKeyProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AdminKeyProvider>,
    renderOptions,
  );
}
