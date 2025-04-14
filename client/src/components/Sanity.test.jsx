import React from 'react';
import { render, screen } from '@testing-library/react';

test('renders simple text', () => {
    render(<div>Hello Cache Converters!</div>);
    expect(screen.getByText('Hello Cache Converters!')).toBeInTheDocument();
});