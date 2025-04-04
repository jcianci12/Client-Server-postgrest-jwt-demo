# Hire Equipment API Updates

## Overview
The hire equipment API has been updated to work directly with jobsites instead of daily records. This change simplifies the data model and makes it easier to track equipment across a jobsite's lifetime.

## Key Changes

1. Data Model Changes:
   - `daily_record_id` has been replaced with `jobsite_id`
   - Added new fields:
     - `supplier_name` (required)
     - `reference_number` (optional)
     - `cost_per_day` (optional, decimal)
     - `expected_return` (optional, datetime)
     - `status` (string, defaults to "Active")
     - `condition_on_hire` (optional, text)
     - `condition_on_return` (optional, text)

2. Endpoint Changes:
   Current verbose endpoints:
   ```
   GET    /api/hire_equipment/jobsite/{jobsite_id}
   GET    /api/hire_equipment/overdue
   PUT    /api/hire_equipment/{id}/status
   POST   /api/hire_equipment
   PUT    /api/hire_equipment/{id}
   DELETE /api/hire_equipment/{id}
   ```

   Suggested simplified structure:
   ```
   # Base path: /api/v1
   
   # List/Create endpoints
   GET    /jobsites/{jobsite_id}/equipment     # List equipment for jobsite
   POST   /jobsites/{jobsite_id}/equipment     # Create new equipment
   GET    /equipment/overdue                    # List overdue equipment
   
   # Individual equipment endpoints
   GET    /equipment/{id}                      # Get single equipment
   PUT    /equipment/{id}                      # Update equipment
   DELETE /equipment/{id}                      # Delete equipment
   PUT    /equipment/{id}/status               # Update status only
   ```

   Benefits:
   - More RESTful structure
   - Clearer resource hierarchy
   - Shorter, more memorable URLs
   - Versioned API for better future compatibility
   - Consistent with other API endpoints

3. Status Management:
   - Added status transitions (Active -> Returned)
   - Cannot change status from Returned to Active
   - New endpoint: `/equipment/{id}/status` for status updates

## Required Frontend Updates

1. Update Models:
   - Update `HireEquipmentCreate` interface
   - Update `HireEquipmentResponse` interface
   - Update `HireEquipmentUpdate` interface
   - Add `HireEquipmentStatus` enum

2. Update Components:
   - Modify hire equipment forms to use jobsite selection instead of daily record
   - Add new fields to create/edit forms
   - Update list views to show new fields
   - Add status management UI
   - Consider adding an overdue equipment view

3. Service Updates:
   - Update API service calls to use new endpoints
   - Add handling for new status transitions
   - Implement overdue equipment fetching

## Migration Notes
- Existing hire equipment records have been migrated to link directly to jobsites
- The migration preserves all existing data
- No data loss should occur during the transition

## Next Steps
1. Wait for the API.ts regeneration
2. Update your models and interfaces
3. Update components to use new fields
4. Test all CRUD operations with the new structure

## Example Usage

```typescript
// Creating new hire equipment
const newEquipment: HireEquipmentCreate = {
  jobsite_id: jobsiteId,
  supplier_name: "Supplier Co",
  item: "Excavator",
  reference_number: "EX-123",
  cost_per_day: 250.00,
  on_hire: new Date(),
  expected_return: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  status: HireEquipmentStatus.ACTIVE
};

// Updating status
await client.update_hire_equipment_status_api_hire_equipment_hire_equipment__hire_equipment_id__status_put(
  equipmentId,
  HireEquipmentStatus.RETURNED
);

// Getting overdue equipment for a jobsite
const overdueEquipment = await client.get_overdue_equipment_api_hire_equipment_overdue_get(jobsiteId);
```

