from pydantic import ValidationError
import pytest
from models.schemas import OrderItem, OrderUpdate, CustomerCreate

def test_quantity_must_be_positive():
    with pytest.raises(ValidationError):
        OrderItem(product_name="Tomato", quantity=-5)
    with pytest.raises(ValidationError):
        OrderItem(product_name="Tomato", quantity=0)
    item = OrderItem(product_name="Tomato", quantity=10.5)
    assert item.quantity == 10.5

def test_invalid_units_fallback():
    # valid unit
    item1 = OrderItem(product_name="Tomato", quantity=5, unit="box")
    assert item1.unit == "box"
    
    # invalid unit
    item2 = OrderItem(product_name="Tomato", quantity=5, unit="random_unit")
    assert item2.unit == "kg"

def test_invalid_status_rejected():
    with pytest.raises(ValidationError):
        OrderUpdate(status="random_status")
    update = OrderUpdate(status="in_transit")
    assert update.status == "in_transit"

def test_lat_lng_bounds_enforced():
    with pytest.raises(ValidationError):
        CustomerCreate(name="Aditya", lat=100)  # out of bounds
    with pytest.raises(ValidationError):
        CustomerCreate(name="Aditya", lng=-200) # out of bounds
    customer = CustomerCreate(name="Aditya", lat=90, lng=180)
    assert customer.lat == 90
    assert customer.lng == 180
