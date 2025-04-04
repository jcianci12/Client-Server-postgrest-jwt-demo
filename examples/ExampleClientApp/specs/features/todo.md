# Todo List

## High Priority

### 1. QR Code Jobsite Access

#### Backend Tasks
- [x] Fix unauthorized access in token recreation (failing tests)
- [x] Create check-in endpoint for visitors and contractors
  - [x] Record visitor/contractor type
  - [x] Record induction status for contractors
  - [x] Add check-in to site diary automatically
- [x] Create endpoint to view who is currently on site
- [x] Create check-out endpoint

#### Frontend Tasks
- [x] Create mobile-friendly check-in flow:
  - [x] QR code scan result page
  - [x] "Are you a visitor or contractor?" selection
  - [x] For contractors: "Have you been inducted into this site?" (Yes/No)
  - [x] Instructions based on selection:
    - [x] If contractor + inducted: "Check in with site supervisor and start work"
    - [x] If contractor + not inducted: "See site supervisor for induction before starting work"
    - [x] If visitor: "Report to site supervisor and be accompanied at all times"
  - [x] Confirmation page showing check-in recorded
- [x] Integrate check-in flow with API endpoints
- [x] Consolidate visitor and contractor check-in components
- [x] Create unified check-in service for both admin and QR code check-ins
- [x] Mobile device compatibility testing

### 2. Map Feature Implementation
- [x] Add location support to jobsites
  - [x] Add latitude/longitude fields to Jobsite model
  - [x] Update JobsiteCreate and JobsiteResponse schemas
  - [x] Add coordinate validation
  - [x] Update API endpoints
  - [x] Add database migration
- [x] Create reusable map component with Leaflet
- [x] Create location picker component
- [x] Integrate map components with jobsite creation/editing
- [x] Add map view to jobsite details page
- [x] Unit tests for map components

### 3. Weather Integration
- [x] Create weather service with Open-Meteo API
- [x] Implement caching for weather data
- [x] Create current weather widget
- [x] Create weather forecast component
- [x] Integrate weather components with jobsite pages
- [x] Unit tests for weather service 

### 4. Authentik OAuth2 Authentication
- [x] Fix redirection issue after first-time login
- [x] Implement auto-fill username with email solution
- [x] Test complete authentication flow with new users
- [x] Document the Authentik configuration changes 