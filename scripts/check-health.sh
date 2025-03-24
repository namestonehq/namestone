#!/bin/bash
# Health Check Script for Namestone API
# Usage: ./check-health.sh [environment]
# Where [environment] is optional and can be local, development, or production

# Default to local environment
ENV=${1:-local}

# Set API base URL based on environment
case "$ENV" in
  "local")
    BASE_URL="http://localhost:3000"
    ;;
  "development")
    BASE_URL="https://dev-api.namestone.com"  # Replace with your actual dev API URL
    ;;
  "production")
    BASE_URL="https://api.namestone.com"      # Replace with your actual prod API URL
    ;;
  *)
    echo "Invalid environment. Choose local, development, or production."
    exit 1
    ;;
esac

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to make request and display results
check_endpoint() {
  local endpoint=$1
  local name=$2
  
  echo -e "${YELLOW}Checking $name...${NC}"
  
  # Make the request and capture response
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  
  # Extract status code (last line) and response body
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Check if status code indicates success
  if [[ "$status_code" == 2* ]]; then
    echo -e "${GREEN}✓ $name is healthy ($status_code)${NC}"
  else
    echo -e "${RED}✗ $name is unhealthy ($status_code)${NC}"
  fi
  
  # Pretty print JSON response
  echo "$body" | python -m json.tool || echo "$body"
  echo ""
}

# Main script execution
echo -e "${YELLOW}Running health checks for $ENV environment ($BASE_URL)${NC}\n"

# Check basic health endpoint
check_endpoint "/api/health" "Basic Health Check"

# Check extended health endpoint
check_endpoint "/api/health/extended" "Extended Health Check"

echo -e "${YELLOW}Health check complete!${NC}" 