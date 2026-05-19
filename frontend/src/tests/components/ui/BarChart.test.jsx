import { render, screen } from '@testing-library/react';
import BarChart from '../../../components/ui/BarChart';

describe('BarChart', () => {

  test('renderiza labels', () => {

    const data = [
      {
        label: 'Ene',
        total: 1000,
        pct: 50,
      },
      {
        label: 'Feb',
        total: 2000,
        pct: 80,
      },
    ];

    render(<BarChart data={data} />);

    expect(screen.getByText('Ene')).toBeInTheDocument();

    expect(screen.getByText('Feb')).toBeInTheDocument();
  });

});