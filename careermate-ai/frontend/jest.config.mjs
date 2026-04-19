import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Path to the Next.js app — loads next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Stub image imports (some assets are referenced but missing on disk)
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/layout.{js,jsx,ts,tsx}',
    '!app/**/index.js',
    '!app/**/data.js',
  ],
};

export default createJestConfig(customJestConfig);
