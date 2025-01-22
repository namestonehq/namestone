#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/^[A-Z]/ { print }')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check for required environment variables
required_vars=(
    "TEST_API_KEY"
    "TEST_DOMAIN"
    "TEST_NAME"
    "TEST_ADDRESS"
    "TEST_BASE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var not found in .env file"
        exit 1
    fi
done

# Function to print test results
print_result() {
    local test_name=$1
    local response=$2
    
    echo "-----------------"
    echo "Test: $test_name"
    echo "Response:"
    echo "$response"
    echo "-----------------"
    echo ""
}

# 1. Test setting a name
echo "Testing set-name endpoint..."
echo "$TEST_BASE_URL/set-name" 
set_name_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: $TEST_API_KEY" \
    -d '{
        "domain": "'$TEST_DOMAIN'",
        "name": "'$TEST_NAME'",
        "address": "'$TEST_ADDRESS'",
        "text_records": {
            "com.twitter": "namestonehq",
            "com.github": "resolverworks",
            "url": "https://www.namestone.com",
            "description": "API Test Example"
        }
    }' \
    "$TEST_BASE_URL/set-name")
print_result "Set Name" "$set_name_response"

# Give the API a moment to process
sleep 2

# 2. Test getting names
echo "Testing get-names endpoint..."
get_names_response=$(curl -s -X GET \
    -H "Authorization: $TEST_API_KEY" \
    "$TEST_BASE_URL/get-names?domain=$TEST_DOMAIN&address=$TEST_ADDRESS")
print_result "Get Names" "$get_names_response"

# 3. Test searching for names
echo "Testing search-names endpoint..."
search_term="${TEST_NAME:0:2}" # Use first 2 characters of test name
search_response=$(curl -s -X GET \
    -H "Authorization: $TEST_API_KEY" \
    "$TEST_BASE_URL/search-names?domain=$TEST_DOMAIN&name=$search_term")
print_result "Search Names" "$search_response"

# 4. Test setting domain
echo "Testing set-domain endpoint..."
set_domain_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: $TEST_API_KEY" \
    -d '{
        "domain": "'$TEST_DOMAIN'",
        "address": "'$TEST_ADDRESS'",
        "text_records": {
            "com.twitter": "namestonehq",
            "com.github": "resolverworks",
            "url": "https://www.namestone.com",
            "description": "Domain Test Example"
        }
    }' \
    "$TEST_BASE_URL/set-domain")
print_result "Set Domain" "$set_domain_response"

# 5. Test getting domain
echo "Testing get-domain endpoint..."
get_domain_response=$(curl \
    "$TEST_BASE_URL/get-domain?domain=$TEST_DOMAIN&api_key=$TEST_API_KEY")
print_result "Get Domain" "$get_domain_response"

# 6. Test deleting name
echo "Testing delete-name endpoint..."
delete_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: $TEST_API_KEY" \
    -d '{
        "domain": "'$TEST_DOMAIN'",
        "name": "'$TEST_NAME'"
    }' \
    "$TEST_BASE_URL/delete-name")
print_result "Delete Name" "$delete_response"

# 7. Reset domain to base state
echo "Resetting domain to base state..."
reset_domain_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: $TEST_API_KEY" \
    -d '{
        "domain": "'$TEST_DOMAIN'",
        "address": "'$TEST_ADDRESS'",
        "text_records": {
            "description": "Base State",
            "url": "https://www.namestone.com"
        }
    }' \
    "$TEST_BASE_URL/set-domain")
print_result "Reset Domain" "$reset_domain_response"

echo "API testing complete!"