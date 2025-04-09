import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders something', () => {
    render(<MyComponent />);
    expect(screen.getByText(/something/i)).toBeInTheDocument();
});