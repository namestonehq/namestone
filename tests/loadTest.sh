#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/^[A-Z]/ { print }')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check for required API key
if [ -z "$DEMO_API_KEY" ]; then
    echo "Error: DEMO_API_KEY not found in .env file"
    exit 1
fi

# Function to run a test iteration
run_test() {
    local REQUESTS_PER_SEC=$1
    local DURATION=$2
    local TOTAL_REQUESTS=$((REQUESTS_PER_SEC * DURATION))
    local INTERVAL=$(bc <<< "scale=3; 1/$REQUESTS_PER_SEC")
    
    echo "Running test with $REQUESTS_PER_SEC requests/second for $DURATION seconds..."
    
    # Create temporary files for this iteration
    temp_file=$(mktemp)
    error_file=$(mktemp)
    latency_file=$(mktemp)
    
  # Start time
    start=$(date +%s)
    
    # Use parallel requests with a controlled launch rate
    for ((i=1; i<=$TOTAL_REQUESTS; i++)); do
        (
            response=$(curl -s -w "\nSTATUS:%{http_code}\nTIME:%{time_total}\n" -X POST \
                -H 'Content-Type: application/json' \
                -H "Authorization: $DEMO_API_KEY" \
                -d '{
                    "domain": "defec7.eth",
                    "name": "demo",
                    "address": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
                    "text_records": {
                        "com.twitter": "namestonehq'$i'",
                        "com.github": "resolverworks",
                        "url": "https://www.namestone.xyz",
                        "description": "Multichain Example",
                        "avatar": "https://imagedelivery.net/UJ5oN2ajUBrk2SVxlns2Aw/e52988ee-9840-48a2-d8d9-8a92594ab200/public"
                    }
                }' \
                https://namestone.xyz/api/public_v1/set-name)
                
            # Process response in subshell
            echo "$response" >> "$temp_file"
            echo "$response" | grep "TIME:" | cut -d: -f2 >> "$latency_file"
            
            # Only log errors (non-success responses)
            if ! echo "$response" | grep -q '"success":true'; then
                echo "Request $i - FAILED Response: $response" >> "$error_file"
            fi
        ) &

        # Control launch rate
        if (( i % 10 == 0 )); then
            sleep 0.1  # Launch in batches of 10
        fi
    done
    
    # Wait for all requests to complete
    wait

    # Count successes (looking for "success":true in responses)
    successful=$(grep -c '"success":true' "$temp_file")
    failed=$((TOTAL_REQUESTS - successful))
    
    # Calculate latency statistics
    avg_latency=$(awk '{ total += $1 } END { printf "%.3f", total/NR }' "$latency_file")
    max_latency=$(awk 'BEGIN{max=0} {if($1>max){max=$1}} END{printf "%.3f", max}' "$latency_file")
    min_latency=$(awk 'BEGIN{min=999999} {if($1<min){min=$1}} END{printf "%.3f", min}' "$latency_file")
    p95_latency=$(sort -n "$latency_file" | awk '{a[NR]=$1}END{printf "%.3f", a[int(NR*0.95)]}')
    p99_latency=$(sort -n "$latency_file" | awk '{a[NR]=$1}END{printf "%.3f", a[int(NR*0.99)]}')

    # End time
    end=$(date +%s)
    duration=$((end - start))
    
    echo "-----------------"
    echo "Test Results for $REQUESTS_PER_SEC req/sec:"
    echo "Duration: $duration seconds"
    echo "Attempted requests: $TOTAL_REQUESTS"
    echo "Successful requests: $successful"
    echo "Failed requests: $failed"
    echo "Success rate: $(bc <<< "scale=2; $successful/$TOTAL_REQUESTS * 100")%"
    echo "Actual rate: $(bc <<< "scale=2; $TOTAL_REQUESTS/$duration") requests/second"
    echo ""
    echo "Latency Statistics (seconds):"
    echo "  Average: $avg_latency"
    echo "  Min: $min_latency"
    echo "  Max: $max_latency"
    echo "  95th percentile: $p95_latency"
    echo "  99th percentile: $p99_latency"
    
    if [ -s "$error_file" ]; then
        echo ""
        echo "Errors and Failed Requests:"
        cat "$error_file"
    fi
    echo "-----------------"
    
    # Cleanup
    rm "$temp_file" "$error_file" "$latency_file"
    
    # Add cool-down period
    echo "Cooling down for 30 seconds..."
    sleep 30
}

# Run progressive load tests
# run_test 10 10  # 10 req/sec for 1 minute
run_test 25 10  # 25 req/sec for 1 minute
# run_test 50 10  # 50 req/sec for 1 minute
run_test 75 10  # 75 req/sec for 1 minute
run_test 100 10 # 100 req/sec for 1 minute

echo "Load testing complete!"