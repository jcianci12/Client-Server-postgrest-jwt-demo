# Map Feature - Backend Requirements

## Overview
We need to add geographical coordinates to jobsites to support a map-based location selection feature in the frontend. This document outlines the required backend changes.

## Database Changes

### Jobsite Model Updates
Add the following fields to the Jobsite model:
```python
latitude: float | None  # Nullable to support existing records and drafts
longitude: float | None  # Nullable to support existing records and drafts
```

### Field Specifications
- `latitude`: Float between -90 and 90
- `longitude`: Float between -180 and 180
- Both fields should be nullable to maintain compatibility with existing records
- Precision should be at least 6 decimal places to ensure accurate location representation

## API Schema Updates

### JobsiteCreate Schema
Add to the existing schema:
```python
class JobsiteCreate(BaseModel):
    # ... existing fields ...
    latitude: Optional[float] = None
    longitude: Optional[float] = None
```

### JobsiteResponse Schema
Add to the existing schema:
```python
class JobsiteResponse(BaseModel):
    # ... existing fields ...
    latitude: Optional[float] = None
    longitude: Optional[float] = None
```

## API Endpoint Updates

The following endpoints need to be updated to handle the new fields:

1. `POST /api/jobsites/` (Create endpoint)
   - Accept latitude/longitude in request body
   - Validate coordinate ranges
   - Store coordinates in database

2. `PUT /api/jobsites/{jobsite_id}` (Update endpoint)
   - Accept latitude/longitude updates
   - Validate coordinate ranges
   - Update coordinates in database

3. `GET /api/jobsites/{jobsite_id}` (Get single jobsite)
   - Include latitude/longitude in response

4. `GET /api/jobsites/` (List jobsites)
   - Include latitude/longitude in response for each jobsite

## Validation Requirements

Add the following validations:
1. Latitude must be between -90 and 90 degrees
2. Longitude must be between -180 and 180 degrees
3. If one coordinate is provided, both must be provided
4. Numbers should be rounded to 6 decimal places maximum

Example validation:
```python
from pydantic import validator

class JobsiteCreate(BaseModel):
    # ... existing fields ...
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @validator('latitude')
    def validate_latitude(cls, v):
        if v is not None and not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90 degrees')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v is not None and not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180 degrees')
        return v

    @validator('longitude', 'latitude')
    def validate_coordinates_presence(cls, v, values):
        # If one coordinate is provided, both must be provided
        if 'latitude' in values and 'longitude' in values:
            if (values['latitude'] is None) != (v is None):
                raise ValueError('Both latitude and longitude must be provided together')
        return v
```

## Migration Plan

1. Create a new database migration to add the nullable fields
2. Update API schemas and endpoints
3. Add validation logic
4. Test with existing records to ensure backward compatibility
5. Update API documentation

## Testing Requirements

Please add tests for:
1. Creating jobsites with valid coordinates
2. Creating jobsites with invalid coordinates (should fail)
3. Updating existing jobsites with coordinates
4. Retrieving jobsites with coordinates
5. Edge cases (null values, boundary values)

## API Documentation Updates

Please update the API documentation to include:
1. New field descriptions
2. Valid value ranges
3. Example requests/responses with coordinates
4. Validation error messages

## Frontend Implementation Status

The following components have been implemented for the map feature:

- [x] Created a reusable `MapPickerComponent` in `src/app/shared/map-picker.component.ts` using Leaflet for rendering
- [x] Integrated map picker with jobsite creation dialog (`CreateJobsiteDialogComponent`)
- [x] Integrated map picker with jobsite editing dialog (`EditJobsiteDialogComponent`)
- [x] Added a map view to the jobsite details page (`JobsiteOverviewComponent`)
- [x] Updated components to send latitude and longitude to the backend API
- [x] Added support for displaying existing coordinates when editing a jobsite
- [x] Added read-only mode to the map component for viewing locations without editing

### Pending Frontend Tasks

- [ ] Add tests for map components
- [ ] Add error handling for coordinate validation
- [ ] Improve mobile responsiveness of map components

## Integration Plan

Now that the backend API has been updated to include latitude and longitude fields, the frontend integration is complete. The following steps have been implemented:

1. **API Client Integration**: The API client has been regenerated to include the new latitude and longitude fields in the `JobsiteCreate`, `JobsiteUpdate`, and `JobsiteResponse` classes.

2. **Create/Edit Components**: The jobsite creation and editing components have been updated to:
   - Allow users to select a location on the map
   - Send the selected coordinates to the backend when creating or updating a jobsite
   - Validate that a location has been selected before submitting

3. **View Components**: The jobsite overview component has been updated to:
   - Display a read-only map showing the jobsite location
   - Show the coordinates in a user-friendly format
   - Handle cases where no location data is available

4. **Error Handling**: Basic error handling has been implemented to:
   - Require location selection before form submission
   - Handle API errors gracefully
   - Display appropriate messages to the user

The map feature is now fully integrated with the backend API and ready for testing.

## Timeline
Please let us know the estimated timeline for these changes so we can coordinate the frontend implementation. 