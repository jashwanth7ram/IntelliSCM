#!/bin/bash
echo "=== IntelliSCM E2E Whitebox Test ==="

API_URL="http://localhost:5001/api"
EMAIL_DEV="dev_$RANDOM@test.com"
EMAIL_CCB="ccb_$RANDOM@test.com"
EMAIL_PM="pm_$RANDOM@test.com"

echo -e "\n1. Registering Project Manager ($EMAIL_PM)..."
RES_PM=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Charlie PM\", \"username\": \"charliepm$RANDOM\", \"email\": \"$EMAIL_PM\", \"password\": \"testpass\", \"confirmPassword\": \"testpass\", \"role\": \"Project Manager\"}")
PM_TOKEN=$(echo $RES_PM | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo -e "\n2. Creating a Project as PM..."
RES_PROJ=$(curl -s -X POST $API_URL/projects \
  -H "Authorization: Bearer $PM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Apollo Dashboard\", \"description\": \"Main UI\", \"repositoryUrl\": \"https://github.com/apollo\"}")
PROJ_ID=$(echo $RES_PROJ | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJ_ID" ]; then
  echo "FAILED: Could not create Project."
  exit 1
fi
echo "Project Created: $PROJ_ID"

echo -e "\n3. Registering Developer ($EMAIL_DEV)..."
RES_DEV=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Alice Dev\", \"username\": \"alicedev$RANDOM\", \"email\": \"$EMAIL_DEV\", \"password\": \"testpass\", \"confirmPassword\": \"testpass\", \"role\": \"Developer\"}")
DEV_TOKEN=$(echo $RES_DEV | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo -e "\n4. Submitting Change Request as Developer..."
RES_CR=$(curl -s -X POST $API_URL/crs \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Implement OAuth2\", \"description\": \"Adding secure login\", \"project\": \"$PROJ_ID\", \"changeType\": \"Feature\", \"priority\": \"High\", \"linesOfCode\": 300, \"testingPlan\": \"Unit tests added\", \"targetEnvironment\": \"Development\", \"affectedComponents\": [\"Auth\"]}")
CR_ID=$(echo $RES_CR | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CR_ID" ]; then
  echo "FAILED: Could not submit CR. Response: $RES_CR"
  exit 1
fi
echo "CR Created: $CR_ID"

echo -e "\n5. Registering CCB Member ($EMAIL_CCB)..."
RES_CCB=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Bob CCB\", \"username\": \"bobccb$RANDOM\", \"email\": \"$EMAIL_CCB\", \"password\": \"testpass\", \"confirmPassword\": \"testpass\", \"role\": \"CCB Member\"}")
CCB_TOKEN=$(echo $RES_CCB | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo -e "\n6. Approving Change Request as CCB Member ($CR_ID)..."
RES_DECIDE=$(curl -s -X POST $API_URL/ccb/decide \
  -H "Authorization: Bearer $CCB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"crId\": \"$CR_ID\", \"decision\": \"Approved\", \"comments\": \"Looks good to merge.\"}")
echo $RES_DECIDE | grep -q 'crStatus":"Approved' && echo "SUCCESS: CR Approved!" || echo "FAILED to approve."

echo -e "\n=== Test Complete ==="
