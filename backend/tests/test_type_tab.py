"""
SupplySetu AI — Type Tab Edge Case Test Suite
==============================================
Tests the /api/transcribe/extract endpoint with:
  - Normal cases (English, Hindi, Hinglish)
  - Edge cases (empty, gibberish, extreme quantities, SQL injection, etc.)

Usage:
  python test_type_tab.py [backend_url]
  e.g. python test_type_tab.py https://supplysetu-backend.onrender.com
  or   python test_type_tab.py http://localhost:8000
"""

import sys
import json
import asyncio
import httpx
from datetime import date

BACKEND_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"
EXTRACT_URL = f"{BACKEND_URL}/api/transcribe/extract"

# ─── Test Cases ───────────────────────────────────────────────────────────────

TESTS = [
    # ── NORMAL CASES ──────────────────────────────────────────────────
    {
        "id": "N01",
        "name": "Plain English order",
        "input": "20 kg tomato and 10 kg onion please",
        "expect_items": True,
        "expect_min_items": 2,
        "expect_products": ["tomato", "onion"],
    },
    {
        "id": "N02",
        "name": "Hindi order (transliterated)",
        "input": "20 kilo tamatar aur 15 kg pyaz bhejna",
        "expect_items": True,
        "expect_min_items": 2,
        "expect_products": ["tomato", "onion"],
    },
    {
        "id": "N03",
        "name": "Hinglish mixed",
        "input": "Bhaiya 2 dozen palak aur 3 kg methi chahiye kal tak",
        "expect_items": True,
        "expect_min_items": 2,
        "expect_products": ["spinach", "fenugreek"],
    },
    {
        "id": "N04",
        "name": "With delivery date",
        "input": "50 kg potato needed tomorrow",
        "expect_items": True,
        "expect_delivery_date": True,
        "expect_min_items": 1,
    },
    {
        "id": "N05",
        "name": "Multiple items, multiple units",
        "input": "5 kg garlic, 2 dozen banana, 10 litre milk, 3 bundle spinach",
        "expect_items": True,
        "expect_min_items": 3,
    },
    {
        "id": "N06",
        "name": "Decimal quantities",
        "input": "2.5 kg ginger and 0.5 kg turmeric",
        "expect_items": True,
        "expect_min_items": 1,
    },
    {
        "id": "N07",
        "name": "Large quantity order",
        "input": "500 kg tomato, 200 kg onion, 100 kg potato for restaurant",
        "expect_items": True,
        "expect_min_items": 3,
    },
    {
        "id": "N08",
        "name": "Customer name mentioned",
        "input": "Ramesh here — need 10 kg tomato and 5 kg garlic",
        "expect_items": True,
        "expect_min_items": 1,
    },

    # ── EDGE CASES ────────────────────────────────────────────────────
    {
        "id": "E01",
        "name": "Empty string",
        "input": "",
        "expect_error": True,  # should 400
    },
    {
        "id": "E02",
        "name": "Whitespace only",
        "input": "     \n\t  ",
        "expect_error": True,
    },
    {
        "id": "E03",
        "name": "Pure gibberish",
        "input": "asdfghjkl qwerty zxcvbnm",
        "expect_items": False,  # LLM should return empty items
    },
    {
        "id": "E04",
        "name": "Greeting with no order",
        "input": "Hello, how are you? Good morning!",
        "expect_items": False,
    },
    {
        "id": "E05",
        "name": "Order with no quantities",
        "input": "I need tomato, onion and potato",
        "expect_items": True,   # items may appear but with default quantity
        "note": "LLM should infer or use default quantity",
    },
    {
        "id": "E06",
        "name": "Only quantity, no product",
        "input": "20 kg please",
        "expect_items": False,  # can't determine product
        "note": "Unknown product should not be saved",
    },
    {
        "id": "E07",
        "name": "Very long input (stress test)",
        "input": "I need 10 kg tomato, 5 kg onion, 3 kg potato, 2 kg garlic, 1 kg ginger, "
                 "4 dozen banana, 2 dozen lemon, 500g turmeric, 1 kg chilli, "
                 "2 bundle coriander, 1 bundle mint, 3 kg capsicum, 5 kg carrot, "
                 "2 kg beetroot, 1 kg radish for my restaurant tomorrow morning",
        "expect_items": True,
        "expect_min_items": 5,
        "note": "Should handle many items without truncation",
    },
    {
        "id": "E08",
        "name": "SQL injection attempt",
        "input": "'; DROP TABLE orders; --",
        "expect_items": False,
        "note": "Should not crash, just return no items",
    },
    {
        "id": "E09",
        "name": "Script injection attempt",
        "input": "<script>alert('xss')</script> 10 kg tomato",
        "expect_items": True,  # should still extract tomato safely
        "note": "Should sanitise but still extract valid items",
    },
    {
        "id": "E10",
        "name": "Negative quantity in text",
        "input": "minus 5 kg tomato",
        "expect_items": True,
        "note": "LLM may extract, but quantity validator should make it positive",
    },
    {
        "id": "E11",
        "name": "Zero quantity",
        "input": "0 kg tomato please",
        "expect_items": False,
        "note": "Zero quantity items should be rejected",
    },
    {
        "id": "E12",
        "name": "Emoji-heavy input",
        "input": "🍅 20 kg tamatar 🧅 15 kg pyaz please 🙏",
        "expect_items": True,
        "expect_min_items": 1,
        "note": "Should handle emojis gracefully",
    },
    {
        "id": "E13",
        "name": "Mixed script (Devanagari + English)",
        "input": "20 kg टमाटर और 10 kg प्याज चाहिए",
        "expect_items": True,
        "note": "Devanagari script should be understood",
    },
    {
        "id": "E14",
        "name": "Price mentioned (should be ignored)",
        "input": "10 kg tomato at Rs 30 per kg and 5 kg onion at 25 rupees",
        "expect_items": True,
        "expect_min_items": 2,
        "note": "Price should not confuse quantity extraction",
    },
    {
        "id": "E15",
        "name": "Ambiguous unit",
        "input": "5 packet of biscuit and 2 crate of mango",
        "expect_items": True,
        "note": "Unusual units should fall back to 'piece' or 'kg'",
    },
]

# ─── Runner ───────────────────────────────────────────────────────────────────

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"

results = []


async def run_test(client: httpx.AsyncClient, test: dict) -> dict:
    tid = test["id"]
    name = test["name"]
    inp = test["input"]
    
    result = {"id": tid, "name": name, "input_preview": inp[:60] + ("…" if len(inp) > 60 else "")}

    try:
        resp = await client.post(EXTRACT_URL, json={"transcript": inp}, timeout=30.0)
        
        # Test E01/E02 — expect 400
        if test.get("expect_error"):
            if resp.status_code == 400:
                result["status"] = PASS
                result["detail"] = f"Correctly returned HTTP 400"
            else:
                result["status"] = FAIL
                result["detail"] = f"Expected HTTP 400, got {resp.status_code}"
            return result

        if resp.status_code != 200:
            result["status"] = FAIL
            result["detail"] = f"HTTP {resp.status_code}: {resp.text[:100]}"
            return result

        data = resp.json()
        items = data.get("items", [])
        confidence = data.get("confidence", 0.0)
        delivery_date = data.get("delivery_date")

        issues = []

        # Check items expected
        if test.get("expect_items") and not items:
            issues.append("Expected items but got none")
        if test.get("expect_items") is False and items:
            issues.append(f"Expected no items but got {len(items)}: {[i.get('product_name') for i in items]}")

        # Check minimum item count
        min_items = test.get("expect_min_items", 0)
        if min_items and len(items) < min_items:
            issues.append(f"Expected ≥{min_items} items, got {len(items)}")

        # Check expected products (case-insensitive substring)
        for expected_prod in test.get("expect_products", []):
            found = any(
                expected_prod.lower() in i.get("product_name", "").lower()
                for i in items
            )
            if not found:
                issues.append(f"Expected product '{expected_prod}' not found in {[i.get('product_name') for i in items]}")

        # Check delivery date expected
        if test.get("expect_delivery_date") and not delivery_date:
            issues.append("Expected a delivery_date but none returned")

        # Validate quantities are positive
        for item in items:
            if item.get("quantity", 1) <= 0:
                issues.append(f"Item '{item.get('product_name')}' has non-positive quantity: {item.get('quantity')}")

        # Validate no product_name is empty/None
        for item in items:
            if not item.get("product_name", "").strip():
                issues.append("Item with empty product_name found")

        if issues:
            result["status"] = FAIL if test.get("expect_items") is not None else WARN
            result["detail"] = " | ".join(issues)
        else:
            result["status"] = PASS
            result["detail"] = f"{len(items)} item(s) extracted, confidence={confidence:.0%}"
            if delivery_date:
                result["detail"] += f", delivery={delivery_date}"

        result["items"] = items
        result["note"] = test.get("note", "")

    except httpx.ConnectError:
        result["status"] = FAIL
        result["detail"] = f"Could not connect to {BACKEND_URL} — is the backend running?"
    except Exception as e:
        result["status"] = FAIL
        result["detail"] = f"Exception: {e}"

    return result


async def main():
    print(f"\n{'='*65}")
    print(f"  SupplySetu AI — Type Tab Test Suite")
    print(f"  Backend: {BACKEND_URL}")
    print(f"  Tests: {len(TESTS)}")
    print(f"{'='*65}\n")

    # Check backend is alive
    async with httpx.AsyncClient() as client:
        try:
            health = await client.get(f"{BACKEND_URL}/health", timeout=10.0)
            print(f"🟢 Backend health: {health.json()}\n")
        except Exception as e:
            print(f"🔴 Backend unreachable: {e}")
            print("   Start backend with: uvicorn main:app --reload\n")
            return

        # Run all tests
        for test in TESTS:
            r = await run_test(client, test)
            results.append(r)

    # ── Print Results ──────────────────────────────────────────────────
    passed = sum(1 for r in results if r["status"] == PASS)
    failed = sum(1 for r in results if r["status"] == FAIL)
    warned = sum(1 for r in results if r["status"] == WARN)

    print(f"\n{'─'*65}")
    print(f"  RESULTS\n{'─'*65}")

    for r in results:
        note = f"  [{r.get('note')}]" if r.get("note") else ""
        print(f"\n{r['status']}  [{r['id']}] {r['name']}")
        print(f"   Input : {r['input_preview']}")
        print(f"   Result: {r['detail']}{note}")
        if r.get("items"):
            for item in r["items"]:
                print(f"          → {item.get('quantity')} {item.get('unit')} {item.get('product_name')}")

    print(f"\n{'='*65}")
    print(f"  SUMMARY: {passed} passed  |  {failed} failed  |  {warned} warnings")
    print(f"  Total: {len(TESTS)} tests")
    print(f"{'='*65}\n")

    if failed == 0:
        print("🎉 All critical tests passed!\n")
    else:
        print(f"⚠️  {failed} test(s) failed — review above\n")


if __name__ == "__main__":
    asyncio.run(main())
