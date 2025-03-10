import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PersonData from '../PersonData';

describe('PersonData Component', () => {
  const mockPersonData = {
    name: 'John Doe',
    gender: 'man',
    age: '30',
    pnr: '199001011234',
    email: 'john.doe@example.com',
    phone: '070-123 45 67',
    street: 'Test Street 123',
    city: 'Stockholm',
    zip: '12345',
    address: 'Test Street 123, 12345 Stockholm'
  };

  it('shows empty state when no data is provided', () => {
    render(<PersonData data={null} />);
    expect(screen.getByText(/No person data generated yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Click "Generate New Person" to get started/i)).toBeInTheDocument();
  });

  it('renders all sections with person data when provided', () => {
    render(<PersonData data={mockPersonData} />);

    // Personal Information section
    const personalSection = screen.getByText('Personal Information').closest('div').parentElement;
    expect(within(personalSection).getByText(/John Doe/)).toBeInTheDocument();
    expect(within(personalSection).getByText(/man/)).toBeInTheDocument();
    expect(within(personalSection).getByText(/30/)).toBeInTheDocument();
    expect(within(personalSection).getByText(/199001011234/)).toBeInTheDocument();

    // Contact Information section
    const contactSection = screen.getByText('Contact Information').closest('div').parentElement;
    expect(within(contactSection).getByText(/john\.doe@example\.com/)).toBeInTheDocument();
    expect(within(contactSection).getByText(/070-123 45 67/)).toBeInTheDocument();

    // Address section
    const addressSection = screen.getByText('Address').closest('div').parentElement;
    const streetLabel = within(addressSection).getByText('Street:');
    const cityLabel = within(addressSection).getByText('City:');
    const zipLabel = within(addressSection).getByText('Zip:');
    
    expect(within(streetLabel.parentElement).getByText(/Test Street 123/)).toBeInTheDocument();
    expect(within(cityLabel.parentElement).getByText(/Stockholm/)).toBeInTheDocument();
    expect(within(zipLabel.parentElement).getByText(/12345/)).toBeInTheDocument();
  });

  it('skips rendering empty fields', () => {
    const partialData = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };

    render(<PersonData data={partialData} />);

    // These should be present
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/john\.doe@example\.com/)).toBeInTheDocument();

    // These should not be present
    expect(screen.queryByText(/Address/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gender/)).not.toBeInTheDocument();
  });
});