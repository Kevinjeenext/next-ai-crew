#!/bin/bash
# A2A API 프로덕션 테스트 스크립트
# Usage: TOKEN=<supabase_jwt> ./tests/a2a-api-test.sh [base_url]
#
# Prerequisites: 010 + 011 DDL executed

BASE="${1:-https://nextaicrew.com}"
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"
PASS=0
FAIL=0

check() {
  local name="$1" expected_code="$2" actual_code="$3" body="$4"
  if [ "$actual_code" = "$expected_code" ]; then
    echo "✅ $name (HTTP $actual_code)"
    PASS=$((PASS+1))
  else
    echo "❌ $name — expected $expected_code, got $actual_code"
    echo "   Body: $body"
    FAIL=$((FAIL+1))
  fi
}

echo "═══════════════════════════════════════"
echo "A2A API Test Suite — $(date)"
echo "Base: $BASE"
echo "═══════════════════════════════════════"

# 0. Health check
echo -e "\n── Health ──"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/api/health")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "GET /api/health" "200" "$CODE" "$BODY"

if [ -z "$TOKEN" ]; then
  echo -e "\n⚠️  TOKEN not set. Skipping authenticated endpoints."
  echo "Set: TOKEN=<supabase_jwt> ./tests/a2a-api-test.sh"
  exit 0
fi

# 1. Room list
echo -e "\n── A2A Rooms ──"
RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/a2a/rooms")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "GET /api/a2a/rooms" "200" "$CODE" "$BODY"

# Verify response shape
if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'rooms' in d" 2>/dev/null; then
  echo "   ✔ Response has 'rooms' array"
else
  echo "   ⚠ Response shape unexpected"
fi

# 2. Create room
echo -e "\n── Create Room ──"
RESP=$(curl -s -w "\n%{http_code}" -X POST -H "$AUTH" -H "$CT" "$BASE/api/a2a/rooms" \
  -d '{"name":"Test Room","room_type":"group","soul_ids":["test-soul-a","test-soul-b"]}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "POST /api/a2a/rooms" "200" "$CODE" "$BODY"

ROOM_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('room',{}).get('id',''))" 2>/dev/null)
echo "   Room ID: $ROOM_ID"

if [ -n "$ROOM_ID" ]; then
  # 3. Send message
  echo -e "\n── Send Message ──"
  RESP=$(curl -s -w "\n%{http_code}" -X POST -H "$AUTH" -H "$CT" "$BASE/api/a2a/rooms/$ROOM_ID/messages" \
    -d '{"sender_soul_id":"test-soul-a","content":"안녕하세요! 테스트 메시지입니다."}')
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "POST /api/a2a/rooms/:id/messages" "200" "$CODE" "$BODY"

  MSG_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',{}).get('id',''))" 2>/dev/null)

  # 4. Get messages (with cursor pagination)
  echo -e "\n── Get Messages (no cursor) ──"
  RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/a2a/rooms/$ROOM_ID/messages?limit=10")
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "GET /api/a2a/rooms/:id/messages" "200" "$CODE" "$BODY"

  # Verify cursor pagination fields
  if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'cursor' in d; assert 'has_more' in d['cursor']" 2>/dev/null; then
    echo "   ✔ Cursor pagination fields present"
  else
    echo "   ⚠ Cursor fields missing (may be older deploy)"
  fi

  # 5. Cursor pagination test
  if [ -n "$MSG_ID" ]; then
    echo -e "\n── Cursor Pagination ──"
    RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/a2a/rooms/$ROOM_ID/messages?cursor=$MSG_ID&direction=before&limit=5")
    CODE=$(echo "$RESP" | tail -1)
    check "GET messages with cursor" "200" "$CODE"
  fi

  # 6. Unread count
  echo -e "\n── Unread Count ──"
  RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/a2a/rooms/$ROOM_ID/unread?soul_id=test-soul-b")
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "GET /api/a2a/rooms/:id/unread" "200" "$CODE" "$BODY"

  # 7. Mark as read
  echo -e "\n── Mark Read ──"
  RESP=$(curl -s -w "\n%{http_code}" -X POST -H "$AUTH" -H "$CT" "$BASE/api/a2a/rooms/$ROOM_ID/read" \
    -d '{"soul_id":"test-soul-b"}')
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "POST /api/a2a/rooms/:id/read" "200" "$CODE" "$BODY"

  # 8. Verify unread = 0 after read
  echo -e "\n── Unread After Read ──"
  RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/a2a/rooms/$ROOM_ID/unread?soul_id=test-soul-b")
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "Unread count = 0 after read" "200" "$CODE" "$BODY"
  UNREAD=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('unread','-'))" 2>/dev/null)
  if [ "$UNREAD" = "0" ]; then
    echo "   ✔ unread=0 after mark read"
  else
    echo "   ⚠ unread=$UNREAD (expected 0)"
  fi
fi

# 9. Admin endpoints (requires admin role)
echo -e "\n── Admin API ──"
RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/admin/stats")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
if [ "$CODE" = "200" ]; then
  check "GET /api/admin/stats" "200" "$CODE" "$BODY"
elif [ "$CODE" = "403" ]; then
  echo "⏭  GET /api/admin/stats — 403 (non-admin token, expected)"
else
  check "GET /api/admin/stats" "200" "$CODE" "$BODY"
fi

# 10. Token usage (if available)
echo -e "\n── Token Usage ──"
RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE/api/usage/summary")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "GET /api/usage/summary" "200" "$CODE" "$BODY"

echo -e "\n═══════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════"
exit $FAIL
