# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project using React 19 with SWC for Fast Refresh. The project uses a minimal setup with strict TypeScript configuration and ESLint for code quality.

## Development Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Type check and build for production
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

## Tech Stack

- **Build Tool**: Vite 7 with `@vitejs/plugin-react-swc`
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9 with strict mode enabled
- **Linting**: ESLint 9 with TypeScript ESLint, React Hooks, and React Refresh plugins

## TypeScript Configuration

The project uses a composite TypeScript setup:
- `tsconfig.json` - Root config that references app and node configs
- `tsconfig.app.json` - Application code config with strict settings including:
  - `noUnusedLocals` and `noUnusedParameters` enabled
  - `erasableSyntaxOnly` and `noUncheckedSideEffectImports` enabled
  - `verbatimModuleSyntax` for precise import/export handling
- `tsconfig.node.json` - Build tooling configuration

When running `npm run build`, TypeScript compiles using the `-b` (build mode) flag which respects the composite project structure.

## ESLint Configuration

The project uses flat config (`eslint.config.js`) with:
- TypeScript ESLint recommended rules
- React Hooks recommended-latest rules
- React Refresh Vite configuration
- Browser globals configured
- `dist` folder ignored

## Architecture

This is a standard Vite-React starter template with:
- Entry point: `src/main.tsx` - Renders the App component into the root element
- Main component: `src/App.tsx` - Simple counter example demonstrating React hooks
- Global styles: `src/index.css` and `src/App.css`
- Static assets: `src/assets/` directory

The project uses React 19's createRoot API with StrictMode enabled for development checks.
