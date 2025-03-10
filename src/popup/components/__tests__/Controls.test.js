import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Controls from '../Controls';

describe('Controls Component', () => {
  const mockOnGenerate = jest.fn();
  const mockOnPopulateForm = jest.fn();
  const mockOnClearData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all buttons', () => {
    render(
      <Controls
        onGenerate={mockOnGenerate}
        onPopulateForm={mockOnPopulateForm}
        onClearData={mockOnClearData}
      />
    );

    expect(screen.getByText(/Generate New Person/i)).toBeInTheDocument();
    expect(screen.getByText(/Populate Form on Page/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Cached Data/i)).toBeInTheDocument();
  });

  it('calls onGenerate with correct params when generating new person', () => {
    render(
      <Controls
        onGenerate={mockOnGenerate}
        onPopulateForm={mockOnPopulateForm}
        onClearData={mockOnClearData}
      />
    );

    // Set filter values
    fireEvent.change(screen.getByLabelText(/Min Age/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Max Age/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Gender/i), { target: { value: 'man' } });

    // Click generate button
    fireEvent.click(screen.getByText(/Generate New Person/i));

    expect(mockOnGenerate).toHaveBeenCalledWith({
      age_min: '20',
      age_max: '30',
      gender: 'man'
    });
  });

  it('calls onPopulateForm when clicking populate button', () => {
    render(
      <Controls
        onGenerate={mockOnGenerate}
        onPopulateForm={mockOnPopulateForm}
        onClearData={mockOnClearData}
      />
    );

    fireEvent.click(screen.getByText(/Populate Form on Page/i));
    expect(mockOnPopulateForm).toHaveBeenCalled();
  });

  it('calls onClearData when clicking clear button', () => {
    render(
      <Controls
        onGenerate={mockOnGenerate}
        onPopulateForm={mockOnPopulateForm}
        onClearData={mockOnClearData}
      />
    );

    fireEvent.click(screen.getByText(/Clear Cached Data/i));
    expect(mockOnClearData).toHaveBeenCalled();
  });
});