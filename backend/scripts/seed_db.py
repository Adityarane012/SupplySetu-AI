import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed():
    print("Cleaning existing data...")
    # Clean tables without failing if they don't exist
    try: supabase.table("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception: pass
    try: supabase.table("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception: pass
    try: supabase.table("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception: pass

    print("Inserting customers...")
    customers = [
        {"name": "ABC Stores", "phone": "+919876543210", "address": "Crawford Market, Mumbai", "lat": 18.9482, "lng": 72.8335},
        {"name": "Sharma Kirana", "phone": "+919876543211", "address": "Andheri West, Mumbai", "lat": 19.1136, "lng": 72.8697},
        {"name": "Hotel Sai Ram", "phone": "+919876543212", "address": "Bandra Kurla Complex", "lat": 19.0616, "lng": 72.8561},
    ]
    cust_res = supabase.table("customers").insert(customers).execute()
    c_data = cust_res.data
    
    print("Inserting orders...")
    orders = [
        {
            "customer_id": c_data[0]["id"],
            "customer_name": c_data[0]["name"],
            "status": "pending",
            "source": "whatsapp_text",
            "notes": "Deliver before 10 AM",
        },
        {
            "customer_id": c_data[1]["id"],
            "customer_name": c_data[1]["name"],
            "status": "in_transit",
            "source": "simulator_voice",
        },
        {
            "customer_id": c_data[2]["id"],
            "customer_name": c_data[2]["name"],
            "status": "delivered",
            "source": "manual",
        }
    ]
    ord_res = supabase.table("orders").insert(orders).execute()
    o_data = ord_res.data
    
    print("Inserting order items...")
    items = [
        # Order 1
        {"order_id": o_data[0]["id"], "product_name": "Tomato", "quantity": 20, "unit": "kg"},
        {"order_id": o_data[0]["id"], "product_name": "Onion", "quantity": 10, "unit": "kg"},
        # Order 2
        {"order_id": o_data[1]["id"], "product_name": "Potato (Premium)", "quantity": 50, "unit": "kg"},
        # Order 3
        {"order_id": o_data[2]["id"], "product_name": "Green Peas", "quantity": 15, "unit": "kg"},
    ]
    supabase.table("order_items").insert(items).execute()
    
    print("Seeding complete! Database is ready.")

if __name__ == "__main__":
    seed()
