#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing JWT Authentication Setup..."

# Test 1: Check if services are running
echo -e "\n1. Checking services..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}✗ Services are not running${NC}"
    exit 1
fi

# Test 2: Check JWT settings endpoint
echo -e "\n2. Testing JWT settings endpoint..."
response=$(curl -s http://localhost:3000/jwt_settings)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ JWT settings endpoint is accessible${NC}"
    echo "Response: $response"
else
    echo -e "${RED}✗ JWT settings endpoint is not accessible${NC}"
    exit 1
fi

# Test 3: Test database connection
echo -e "\n3. Testing database connection..."
docker-compose exec db psql -U postgres -d app_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi

# Test 4: Check JWT functions
echo -e "\n4. Testing JWT functions..."
docker-compose exec db psql -U postgres -d app_db -c "SELECT decode_jwt('test');" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ JWT functions are available${NC}"
else
    echo -e "${RED}✗ JWT functions are not available${NC}"
    exit 1
fi

echo -e "\n${GREEN}All tests completed successfully!${NC}" 