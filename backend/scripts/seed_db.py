import os
import sys
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed():
    print("Cleaning existing data...")
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
        {"name": "Fresh Mart", "phone": "+919876543213", "address": "Dadar, Mumbai", "lat": 19.0176, "lng": 72.8562},
    ]
    cust_res = supabase.table("customers").insert(customers).execute()
    c_data = cust_res.data
    
    print("Inserting orders...")
    statuses = ["pending", "in_transit", "delivered"]
    sources = ["whatsapp_text", "simulator_voice", "manual"]
    products = [
        ("Tomato", "kg", 5, 30),
        ("Onion", "kg", 10, 50),
        ("Potato (Premium)", "kg", 10, 60),
        ("Green Peas", "kg", 5, 20)
    ]
    
    orders = []
    items = []
    
    # Generate 40 orders spread across the last 7 days
    for i in range(40):
        c = random.choice(c_data)
        days_ago = random.randint(0, 6)
        date = (datetime.today() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        # Make older orders more likely to be delivered
        status = "delivered" if days_ago > 1 else random.choice(statuses)
        
        orders.append({
            "customer_id": c["id"],
            "customer_name": c["name"],
            "status": status,
            "source": random.choice(sources),
            "scheduled_date": date,
            "notes": "Please deliver fresh" if random.random() > 0.7 else None,
        })
        
    ord_res = supabase.table("orders").insert(orders).execute()
    o_data = ord_res.data
    
    print("Inserting order items...")
    for o in o_data:
        # 1 to 4 items per order
        num_items = random.randint(1, 4)
        order_products = random.sample(products, num_items)
        
        for p in order_products:
            items.append({
                "order_id": o["id"],
                "product_name": p[0],
                "quantity": random.randint(p[2], p[3]),
                "unit": p[1]
            })
            
    # Insert items in batches of 50 to avoid any potential limits
    for i in range(0, len(items), 50):
        supabase.table("order_items").insert(items[i:i+50]).execute()
    
    print("Seeding complete! Database is ready.")

if __name__ == "__main__":
    seed()

