import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config, validateConfig } from '../config';

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have required config properties', () => {
    expect(config).toHaveProperty('apiBaseUrl');
    expect(config).toHaveProperty('wsBaseUrl');
    expect(config).toHaveProperty('enableMockData');
    expect(config).toHaveProperty('enableDevTools');
    expect(config).toHaveProperty('logLevel');
  });

  it('should have valid log level', () => {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    expect(validLevels).toContain(config.logLevel);
  });

  it('should validate config without errors', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    validateConfig();

    // Should not throw
    expect(() => validateConfig()).not.toThrow();

    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });
});
