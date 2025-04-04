# Data Models

## Core Entities

### User
```typescript
interface User {
  id: string;
  email: string;

  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  created_at: timestamp;
  last_active: timestamp;
  whatsappContact: string;
}
```

### Part Listing
```typescript
interface PartListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  category: string;
  make: string;
  model: string;
  year: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
  status: 'active' | 'sold' | 'inactive';
  created_at: timestamp;
  updated_at: timestamp;
  views: number;
}
```



## Database Schema

### Tables
1. users
   - Primary key: id
   - Indexes: email, location (spatial)

2. part_listings
   - Primary key: id
   - Foreign key: user_id
   - Indexes: location (spatial), category, make, model, year

## Relationships
- User has many PartListings (1:N)
- PartListing belongs to one User (N:1)
