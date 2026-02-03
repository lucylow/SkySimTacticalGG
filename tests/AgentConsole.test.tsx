import { render, screen } from '@testing-library/react';
import AgentConsole from '../src/pages/new/AgentConsole';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme/enhancedEsportsTheme';
import React from 'react';
import { describe, it, expect } from 'vitest';

describe('AgentConsole', () => {
  it('renders input and buttons', () => {
    render(
      <ThemeProvider theme={theme}>
        <AgentConsole />
      </ThemeProvider>
    );

    expect(screen.getByText(/Agent Console/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
