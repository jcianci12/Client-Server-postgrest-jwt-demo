# WorkSite Diary App - Angular Frontend

This is the Angular frontend for the WorkSite Diary App, a comprehensive solution for managing construction site activities.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Documentation Structure

The project documentation is organized as follows:

- **Main Project Specifications**: Located in the `/specs` directory at the project root. This contains the complete project specifications, API documentation, and overall architecture.

- **Frontend Documentation**: 
  - [Frontend Specification](spec.md) - Overview of the Angular frontend implementation
  - [Frontend-specific docs](docs/) - Detailed documentation for specific frontend features

## Architecture

The frontend is built with:

- Angular 17+ with standalone components
- TypeScript for type safety
- SCSS for styling
- Auto-generated API clients (see `src/app/api/api.ts`)

## Development Guidelines

- Follow Angular's official style guide
- Use standalone components instead of modules
- Maintain strict type safety with TypeScript interfaces
- Keep documentation updated with frontend progress
- Organize frontend-specific documentation in the docs/ directory

## Features

The application includes features for:

- Authentication & user management
- Jobsite management
- Diary entries with photo attachments
- Equipment tracking
- Inspections
- Visitor management
- Deliveries tracking
- Subcontractor management
- QR code jobsite access
- Map integration
- Weather data display

For a complete list of features and their status, see the [Frontend Specification](spec.md). 