import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/components/common/pagination';

/**
 * Pagination is server-driven (FR-8): this component reports what the API said and asks
 * for another page. The arithmetic in the summary line is the only logic it owns, and
 * getting it wrong is the kind of off-by-one nobody notices until page two.
 */

const meta = { data: [], page: 2, limit: 20, total: 45, totalPages: 3 };

describe('pagination', () => {
  it('reports the range the current page covers', () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} noun="doctors" />);

    const summary = screen.getByText(/Showing/);
    expect(summary).toHaveTextContent('Showing 21–40 of 45 doctors');
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('clamps the upper bound on a partial last page', () => {
    render(
      <Pagination meta={{ ...meta, page: 3 }} onPageChange={vi.fn()} noun="doctors" />,
    );

    // 3 × 20 = 60, but there are only 45 records.
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 41–45 of 45 doctors');
  });

  it('renders nothing at all when there are no records', () => {
    const { container } = render(
      <Pagination meta={{ ...meta, page: 1, total: 0, totalPages: 0 }} onPageChange={vi.fn()} />,
    );

    // An empty state is already on screen; a "Showing 0–0 of 0" bar under it is noise.
    expect(container).toBeEmptyDOMElement();
  });

  it('disables the ends rather than allowing an out-of-range page', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <Pagination meta={{ ...meta, page: 1 }} onPageChange={onPageChange} />,
    );
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();

    rerender(<Pagination meta={{ ...meta, page: 3 }} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Previous/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
