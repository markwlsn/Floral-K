import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HeroConcierge } from '../components/storefront/HeroConcierge';

describe('HeroConcierge Attention & Conversion Component', () => {
  it('renders headline and 30-second concierge form', () => {
    const onFindMatch = vi.fn();
    render(<HeroConcierge onFindMatch={onFindMatch} />);

    expect(screen.getByText(/Breathtaking Blooms/i)).toBeInTheDocument();
    expect(screen.getByText(/Find The Perfect Flower/i)).toBeInTheDocument();
    expect(screen.getByText(/Love & Romance/i)).toBeInTheDocument();
    expect(screen.getByText(/Birthday Cheer/i)).toBeInTheDocument();
  });

  it('submits occasion and budget when user clicks Find Matches', () => {
    const onFindMatch = vi.fn();
    render(<HeroConcierge onFindMatch={onFindMatch} />);

    // Click Birthday Cheer
    const bdayButton = screen.getByText(/Birthday Cheer/i);
    fireEvent.click(bdayButton);

    // Click Under $100 budget
    const budgetBtn = screen.getByText(/Under \$100/i);
    fireEvent.click(budgetBtn);

    // Click Submit
    const submitBtn = screen.getByText(/Show Best Matches For Me/i);
    fireEvent.click(submitBtn);

    expect(onFindMatch).toHaveBeenCalledWith('Birthday', 'under100');
  });

  it('triggers quick emotion jump filter on 1-click', () => {
    const onFindMatch = vi.fn();
    render(<HeroConcierge onFindMatch={onFindMatch} />);

    const loveEmotion = screen.getByText(/I Love You/i);
    fireEvent.click(loveEmotion);

    expect(onFindMatch).toHaveBeenCalledWith('Romance', 'any');
  });
});
