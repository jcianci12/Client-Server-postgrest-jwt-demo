# Deliveries - Backend Updates Required (MVP)

## Overview
Simplify deliveries to track basic delivery information at the jobsite level. MVP focuses on recording what was delivered, when, and who received it.

## Database Changes

### Delivery Model Updates
```python
class Delivery(Base):
    # Remove this field
    # daily_record_id: int = Column(Integer, ForeignKey("daily_records.id"))
    
    # Essential fields only
    jobsite_id: int = Column(Integer, ForeignKey("jobsites.id"), nullable=False)
    company_name: str = Column(String, nullable=False)
    item: str = Column(String, nullable=False)
    qty: int = Column(Integer, nullable=False)
    received_by: str = Column(String, nullable=False)  # Person who received the delivery
    delivery_date: DateTime = Column(DateTime, nullable=False)  # When it was received
    notes: str = Column(String, nullable=True)
```

### Relationship Updates
1. Remove relationship from DailyRecord model:
```python
class DailyRecord(Base):
    # Remove this line
    # deliveries = relationship('Delivery', back_populates='daily_record', cascade='all, delete-orphan')
```

2. Add relationship to Jobsite model:
```python
class Jobsite(Base):
    # Add this line
    deliveries = relationship('Delivery', back_populates='jobsite', cascade='all, delete-orphan')
```

## API Schema Updates

### DeliveryCreate Schema
```python
class DeliveryCreate(BaseModel):
    jobsite_id: int
    company_name: str
    item: str
    qty: int
    received_by: str
    delivery_date: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = None
```

### DeliveryResponse Schema
```python
class DeliveryResponse(BaseModel):
    id: int
    jobsite_id: int
    company_name: str
    item: str
    qty: int
    received_by: str
    delivery_date: datetime
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
```

## API Endpoint Updates

1. Basic CRUD endpoints:
   ```python
   @router.post("/")
   async def create_delivery(delivery: DeliveryCreate) -> DeliveryResponse

   @router.get("/jobsite/{jobsite_id}")
   async def get_deliveries_by_jobsite(jobsite_id: int) -> List[DeliveryResponse]

   @router.get("/{delivery_id}")
   async def get_delivery(delivery_id: int) -> DeliveryResponse

   @router.delete("/{delivery_id}")
   async def delete_delivery(delivery_id: int) -> None

   @router.get("/jobsite/{jobsite_id}/export")
   async def export_deliveries_pdf(
       jobsite_id: int,
       from_date: Optional[datetime] = None,
       to_date: Optional[datetime] = None
   ) -> StreamingResponse:
       """Export all deliveries for a jobsite as PDF, optionally filtered by date range.
       Returns a PDF document with:
       - Jobsite details
       - Delivery list with:
         - Delivery date
         - Company
         - Item and quantity
         - Received by
       - Optional date range header if specified
       """
   ```

## Migration Plan

1. Create new migration to:
   - Add jobsite_id field (nullable initially)
   - Add received_by field
   - Rename/repurpose existing fields as needed

2. Data Migration Steps:
   ```python
   # For each delivery record:
   # 1. Get daily_record
   # 2. Get jobsite_id from daily_record
   # 3. Update delivery with jobsite_id
   # 4. Set delivery_date to created_at for existing records
   # 5. Set received_by to "Unknown" for existing records
   ```

3. After data migration:
   - Make jobsite_id non-nullable
   - Remove daily_record_id column

## Validation Requirements

Basic validations only:
1. Quantity must be positive
2. Required fields must be present
3. Jobsite must exist

Example validation:
```python
class DeliveryCreate(BaseModel):
    @validator('qty')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
```

## Testing Requirements

Essential tests only:
1. Creating deliveries with jobsite association
2. Retrieving deliveries by jobsite
3. Basic CRUD operations
4. Migration process

## Timeline
Please provide estimated timeline for these minimal changes. 