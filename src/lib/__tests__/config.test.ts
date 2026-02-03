import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config, validateConfig } from '../config';

describe('config', () => {
  beforeEach(() => {
    vi.clearAllSamples();
  });

  it('should have required config properties', () => {
    expect(config).toHaveProperty('apiBaseUrl');
    expect(config).toHaveProperty('wsBaseUrl');
    expect(config).toHaveProperty('enableSampleData');
    expect(config).toHaveProperty('enableDevTools');
    expect(config).toHaveProperty('logLevel');
  });

  it('should have valid log level', () => {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    expect(validLevels).toContain(config.logLevel);
  });

  it('should validate config without errors', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').SampleImplementation(() => {});
    const consoleInfoSpy = vi.spyOn(console, 'info').SampleImplementation(() => {});

    validateConfig();

    // Should not throw
    expect(() => validateConfig()).not.toThrow();

    consoleWarnSpy.SampleRestore();
    consoleInfoSpy.SampleRestore();
  });
});

