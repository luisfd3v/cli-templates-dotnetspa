import { describe, expect, it } from 'vitest';
import { deriveNames, toKebabCase, validateProjectName } from '../src/lib/names.js';

describe('toKebabCase', () => {
  it('splits PascalCase into kebab-case', () => {
    expect(toKebabCase('MeuProjeto')).toBe('meu-projeto');
  });

  it('handles consecutive capitals', () => {
    expect(toKebabCase('MinhaAPI')).toBe('minha-api');
  });

  it('handles digits', () => {
    expect(toKebabCase('MinhaAPI2')).toBe('minha-api2');
  });

  it('collapses separators and trims edges', () => {
    expect(toKebabCase('  Loja__App  ')).toBe('loja-app');
  });
});

describe('deriveNames', () => {
  it('builds the documented .NET naming convention', () => {
    expect(deriveNames('MeuProjeto', 'slnx')).toEqual({
      projectName: 'MeuProjeto',
      apiName: 'MeuProjeto.API',
      clientName: 'MeuProjeto.Client',
      npmName: 'meu-projeto',
      solutionFile: 'MeuProjeto.slnx',
    });
  });

  it('honours the classic solution format', () => {
    expect(deriveNames('MeuProjeto', 'sln').solutionFile).toBe('MeuProjeto.sln');
  });
});

describe('validateProjectName', () => {
  it('accepts a valid C# namespace segment', () => {
    expect(validateProjectName('MeuProjeto')).toBeUndefined();
    expect(validateProjectName('App2')).toBeUndefined();
    expect(validateProjectName('Meu_Projeto')).toBeUndefined();
  });

  it('rejects an empty name', () => {
    expect(validateProjectName('')).toBeDefined();
  });

  it('rejects names starting with a digit or a lowercase separator', () => {
    expect(validateProjectName('2App')).toBeDefined();
    expect(validateProjectName('_App')).toBeDefined();
  });

  it('rejects characters that are invalid in a namespace or assembly name', () => {
    expect(validateProjectName('Meu-Projeto')).toBeDefined();
    expect(validateProjectName('Meu Projeto')).toBeDefined();
    expect(validateProjectName('Meu.Projeto')).toBeDefined();
  });

  it('rejects overly long names', () => {
    expect(validateProjectName('A'.repeat(61))).toBeDefined();
  });
});
