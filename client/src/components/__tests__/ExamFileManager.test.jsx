import { render, screen, fireEvent } from '@testing-library/react';
import ExamFileManager from '../ExamFileManager';

test('reads and handles uploaded file', async () => {
    const file = new File(['<exam>example</exam>'], 'exam.qti', { type: 'text/xml' });

    render(<ExamFileManager />);

    const input = screen.getByTestId('file-input'); // Add this `data-testid` in your component
    fireEvent.change(input, { target: { files: [file] } });

    await new Promise((resolve) => setTimeout(resolve, 100)); // simulate async file read

    expect(screen.getByText(/exam uploaded/i)).toBeInTheDocument(); // adjust for your UI
});