import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer, useToast } from '../../../components/ui/Toast';

function TestComponent() {

  const toast = useToast();

  return (
    <button
      onClick={() => toast.success('Toast OK')}
    >
      Mostrar
    </button>
  );
}

describe('Toast', () => {

  test('muestra toast', async () => {

    render(
      <>
        <ToastContainer />
        <TestComponent />
      </>
    );

    fireEvent.click(
      screen.getByText('Mostrar')
    );

    expect(
      await screen.findByText('Toast OK')
    ).toBeInTheDocument();
  });

});