import { render, screen } from '@testing-library/react';
import Donut from '../../../components/ui/Donut';

describe('Donut', () => {

  test('muestra porcentaje', () => {

    render(<Donut pct={75} />);

    expect(
      screen.getByText('75%')
    ).toBeInTheDocument();
  });

});