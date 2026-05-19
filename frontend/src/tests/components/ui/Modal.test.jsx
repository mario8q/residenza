import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Modal from '../../../components/ui/Modal';

describe('Modal', () => {

  test('no renderiza si open es false', () => {

    render(
      <Modal open={false}>
        Hola
      </Modal>
    );

    expect(
      screen.queryByText('Hola')
    ).not.toBeInTheDocument();
  });

  test('renderiza contenido', () => {

    render(
      <Modal open={true}>
        Hola Modal
      </Modal>
    );

    expect(
      screen.getByText('Hola Modal')
    ).toBeInTheDocument();
  });

  test('ejecuta onClose', () => {

    const onClose = vi.fn();

    render(
      <Modal open={true} onClose={onClose}>
        Modal
      </Modal>
    );

    fireEvent.click(
      screen.getByText('Modal').parentElement.parentElement
    );

    expect(onClose).toHaveBeenCalled();
  });

});