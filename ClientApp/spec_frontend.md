# WorkSite Diary App - Angular Frontend

## Frontend Overview
This document provides an overview of the Angular frontend implementation for the WorkSite Diary App. For complete project specifications, please refer to the main [specs directory](../specs) at the project root.

## Documentation Structure

The project documentation is organized as follows:

- **Main Project Specifications**: Located in the `/specs` directory at the project root. This contains:
  - Complete API documentation
  - Data models
  - Project rules and principles
  - Feature roadmap
  - Deployment specifications

- **Frontend Documentation**: 
  - This specification file (`spec.md`) - Overview of the Angular frontend
  - The `docs/` directory - Frontend-specific implementation details

## Current Status
As of February 26, 2025, the Angular frontend has the following features implemented:

- **Authentication & Authorization**
  - User login/logout
  - Role-based access control
  - Company-based access restrictions
  - Automatic redirection to company setup for users without a current company

- **Company Management**
  - Company setup and configuration
  - User management within companies

- **Jobsite Management**
  - Jobsite creation and editing
  - Jobsite overview dashboard

- **Diary Entries**
  - Create, edit, and view diary entries
  - Photo attachments for diary entries

- **Equipment Tracking**
  - Hire equipment management
  - Equipment status tracking

- **Inspections**
  - Inspection scheduling and recording
  - Inspection status tracking

- **Visitor Management**
  - Visitor check-in/check-out
  - Visitor history

- **Deliveries**
  - Delivery scheduling and tracking
  - Delivery status updates

- **Subcontractor Management**
  - Subcontractor registration
  - Subcontractor activity tracking

- **QR Code Jobsite Access**
  - QR code generation for jobsites using dedicated QR code API endpoints
  - QR code display, download, and print functionality
  - Admin-only QR code regeneration
  - Secure QR code image retrieval via dedicated endpoints

## In-Progress Features (as of February 26, 2025)

- [x] QR Code Check-in Interface
  - [x] QR code scanning
  - [x] User type selection (visitor/contractor)
  - [x] Contractor induction confirmation
  - [x] Check-in form
  - [x] Check-in confirmation
  - [x] Check-out functionality

- [x] Map Feature Implementation
  - [x] Create reusable map component with Leaflet
  - [x] Integrate map component with jobsite creation dialog
  - [x] Integrate map component with jobsite editing dialog
  - [x] Allow setting jobsite location by dragging map
  - [x] Add map view to jobsite details page
  - [x] Integrate with backend latitude/longitude fields

- [x] Weather Integration
  - [x] Display current weather on jobsite dashboard
  - [x] Include weather data in diary entries
  - [x] Weather forecast for scheduled work
  - [x] Enhanced weather widget with compact and expanded views
  - [x] Interactive hourly forecast display
  - [x] Configurable weather description visibility
  - [x] Responsive design for different screen sizes

- [ ] Onboarding Flow Testing
  - [ ] Test user registration flow
  - [ ] Test company creation flow
  - [ ] Test initial jobsite setup

## Frontend Documentation
Frontend-specific documentation can be found in the `docs/` directory:

- [Delivery Backend Updates](docs/delivery_backend_updates.md)
- [Hire Equipment Frontend Updates](docs/hire_equipment_frontend_updates.md)
- [Map Feature Backend Requirements](docs/map_feature_backend_requirements.md)

## Architecture
The frontend follows a modern Angular architecture using standalone components. The backend API is accessed through auto-generated TypeScript clients (see `src/app/api/api.ts`).

## Development Guidelines
- Follow Angular's official style guide
- Use standalone components instead of modules
- Maintain strict type safety with TypeScript interfaces
- Keep this spec.md file updated with frontend progress
- Organize frontend-specific documentation in the docs/ directory

## Main Project Documentation
For complete project specifications including backend API details, data models, and overall project guidelines, refer to the [main specs directory](../specs) at the project root. 