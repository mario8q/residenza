import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Sidebar from '../../../components/layout/Sidebar';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

global.confirm = vi.fn(() => true);

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
  })
);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../store/authStore', () => ({
  default: () => ({
    token: 'token',
    logout: mockLogout,
    user: {
      nombre: 'Carlos Admin',
      rol: 'admin',
      conjuntoNombre: 'Bello Horizonte',
      conjuntoId: 1,
    },
  }),
}));

describe('Sidebar', () => {

  test('renderiza conjunto', () => {

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Bello Horizonte/i)
    ).toBeInTheDocument();
  });

  test('renderiza navegación admin', () => {

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Dashboard')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Residentes')
    ).toBeInTheDocument();
  });

  test('logout funciona', async () => {

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText('Carlos Admin')
    );

    expect(mockLogout).toHaveBeenCalled();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

});