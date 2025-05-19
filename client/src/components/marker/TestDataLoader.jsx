import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';

/**
 * Component for loading pre-generated test data into the marker
 */
const TestDataLoader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadTestData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load the pre-generated test data
      const response = await fetch('/resources/examTestData.json');
      if (!response.ok) {
        throw new Error(`Failed to load test data: ${response.statusText}`);
      }

      const testData = await response.json();
      
      // Store the test data in localStorage or state management
      localStorage.setItem('examTestData', JSON.stringify(testData));
      
      // Navigate to the results page with the data
      navigate('/marker/results', { 
        state: { 
          results: testData.statistics,
          students: testData.studentResponses,
          examData: testData.exam,
          questionStats: testData.statistics
        } 
      });
      
    } catch (err) {
      console.error('Error loading test data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Load Representative Test Data
      </Typography>
      
      <Typography variant="body1" paragraph>
        This will load pre-generated test data that includes realistic student responses
        based on actual exam data. This provides more representative statistics than
        random data.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={loadTestData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Test Data'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TestDataLoader; 