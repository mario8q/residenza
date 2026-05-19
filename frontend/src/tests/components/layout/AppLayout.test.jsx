import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import AppLayout from '../../../components/layout/AppLayout';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../components/layout/Sidebar', () => ({
  default: () => <div>Sidebar Mock</div>,
}));

vi.mock('../../../store/authStore', () => ({
  default: () => ({
    user: {
      rol: 'admin',
    },
  }),
}));

vi.mock('../../../store/appStore', () => ({
  default: (selector) =>
    selector({
      getPQRAbiertos: () => [1, 2],
      comunicados: [
        { fecha: '2025-02-10' },
      ],
      residentes: [
        {
          nombre: 'Juan Perez',
          apto: 'A101',
        },
      ],
    }),
}));

describe('AppLayout', () => {

  test('renderiza título correctamente', () => {

    render(
      <MemoryRouter initialEntries={['/residentes']}>
        <Routes>
          <Route path="/residentes" element={<AppLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('Gestión de Residentes')
    ).toBeInTheDocument();
  });

  test('renderiza buscador para admin', () => {

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(
      screen.getByPlaceholderText(/buscar/i)
    ).toBeInTheDocument();
  });

  test('navega al buscar residente', () => {

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/buscar/i);

    fireEvent.change(input, {
      target: {
        value: 'Juan',
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/residentes');
  });

});