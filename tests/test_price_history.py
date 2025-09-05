#!/usr/bin/env python3
"""
Test suite for PriceCompare price history and alert system
"""

import json
import os
import sys
import unittest
from datetime import datetime, timedelta

# Add the scripts directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from scraper import maintain_price_history, calculate_price_analysis, generate_alerts

class TestPriceHistory(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.sample_existing_data = {
            "priceHistoryRetentionDays": 30,
            "products": [
                {
                    "id": "test-product",
                    "name": "Test Product",
                    "category": "Test Category",
                    "prices": [
                        {"store": "superc", "price": 4.99, "unitPrice": "test", "lastUpdated": "2025-09-04"}
                    ],
                    "priceHistory": [
                        {
                            "date": "2025-09-04",
                            "prices": {"superc": 4.99, "iga": 5.19}
                        },
                        {
                            "date": "2025-09-03",
                            "prices": {"superc": 5.29, "iga": 5.49}
                        },
                        {
                            "date": "2025-09-02",
                            "prices": {"superc": 5.19, "iga": 5.39}
                        }
                    ],
                    "watchedBy": []
                }
            ]
        }
        
        self.sample_new_products = [
            {
                "id": "test-product",
                "name": "Test Product",
                "category": "Test Category",
                "prices": [
                    {"store": "superc", "price": 4.49, "unitPrice": "test", "lastUpdated": "2025-09-05"},
                    {"store": "iga", "price": 4.89, "unitPrice": "test", "lastUpdated": "2025-09-05"}
                ]
            }
        ]
    
    def test_price_history_maintenance(self):
        """Test that price history is properly maintained"""
        updated_products = maintain_price_history(self.sample_existing_data, self.sample_new_products)
        
        self.assertEqual(len(updated_products), 1)
        
        product = updated_products[0]
        self.assertIn('priceHistory', product)
        self.assertIn('priceAnalysis', product)
        
        # Check that new price data was added
        history = product['priceHistory']
        self.assertTrue(len(history) > 3)  # Should have added today's data
        
        # Check that the most recent entry has today's date
        today = datetime.now().strftime('%Y-%m-%d')
        self.assertEqual(history[0]['date'], today)
        
        # Check that today's prices are correct
        self.assertEqual(history[0]['prices']['superc'], 4.49)
        self.assertEqual(history[0]['prices']['iga'], 4.89)
    
    def test_price_analysis_calculation(self):
        """Test price analysis calculations"""
        price_history = [
            {"date": "2025-09-05", "prices": {"superc": 4.49, "iga": 4.89}},
            {"date": "2025-09-04", "prices": {"superc": 4.99, "iga": 5.19}},
            {"date": "2025-09-03", "prices": {"superc": 5.29, "iga": 5.49}},
            {"date": "2025-09-02", "prices": {"superc": 5.19, "iga": 5.39}}
        ]
        
        current_prices = [
            {"store": "superc", "price": 4.49},
            {"store": "iga", "price": 4.89}
        ]
        
        analysis = calculate_price_analysis(price_history, current_prices)
        
        self.assertIn('weeklyTrend', analysis)
        self.assertIn('monthlyTrend', analysis)
        self.assertIn('bestHistoricalPrice', analysis)
        self.assertIn('averagePrice', analysis)
        self.assertIn('priceVolatility', analysis)
        
        # Check that best historical price is correct (should be superc at 4.49)
        self.assertEqual(analysis['bestHistoricalPrice']['price'], 4.49)
        self.assertEqual(analysis['bestHistoricalPrice']['store'], 'superc')
        
        # Check that average price is reasonable
        self.assertTrue(4.0 < analysis['averagePrice'] < 6.0)
    
    def test_alert_generation(self):
        """Test that price alerts are generated correctly"""
        products_data = [
            {
                "id": "test-product",
                "name": "Test Product",
                "category": "Test Category",
                "prices": [
                    {"store": "superc", "price": 3.99},  # Significant drop
                    {"store": "iga", "price": 4.89}
                ],
                "priceAnalysis": {
                    "averagePrice": 4.99,
                    "bestHistoricalPrice": {"store": "superc", "price": 3.99, "date": "2025-09-05"},
                    "lastPriceChange": {
                        "date": "2025-09-05",
                        "change": "-1.00",  # $1 drop
                        "store": "superc"
                    }
                }
            }
        ]
        
        alerts = generate_alerts(products_data)
        
        self.assertIn('notifications', alerts)
        self.assertTrue(len(alerts['notifications']) > 0)
        
        # Check for price drop alert
        price_drop_alerts = [a for a in alerts['notifications'] if a['type'] == 'price_drop']
        self.assertTrue(len(price_drop_alerts) > 0)
        
        alert = price_drop_alerts[0]
        self.assertEqual(alert['productId'], 'test-product')
        self.assertEqual(alert['data']['store'], 'superc')
        self.assertEqual(alert['data']['savings'], 1.0)
    
    def test_data_retention(self):
        """Test that old price history data is removed"""
        # Create data with entries older than retention period
        old_date = (datetime.now() - timedelta(days=35)).strftime('%Y-%m-%d')
        
        existing_data = {
            "priceHistoryRetentionDays": 30,
            "products": [
                {
                    "id": "test-product",
                    "name": "Test Product",
                    "category": "Test Category",
                    "priceHistory": [
                        {"date": "2025-09-04", "prices": {"superc": 4.99}},
                        {"date": old_date, "prices": {"superc": 5.99}}  # Should be removed
                    ]
                }
            ]
        }
        
        new_products = [
            {
                "id": "test-product",
                "name": "Test Product",
                "category": "Test Category",
                "prices": [{"store": "superc", "price": 4.49, "unitPrice": "test", "lastUpdated": "2025-09-05"}]
            }
        ]
        
        updated_products = maintain_price_history(existing_data, new_products)
        product = updated_products[0]
        
        # Check that old data was removed
        history_dates = [entry['date'] for entry in product['priceHistory']]
        self.assertNotIn(old_date, history_dates)
    
    def test_new_product_handling(self):
        """Test handling of products with no existing history"""
        new_products = [
            {
                "id": "new-product",
                "name": "New Product",
                "category": "Test Category",
                "prices": [{"store": "superc", "price": 2.99, "unitPrice": "test", "lastUpdated": "2025-09-05"}]
            }
        ]
        
        updated_products = maintain_price_history({}, new_products)
        
        self.assertEqual(len(updated_products), 1)
        product = updated_products[0]
        
        # Should have price history with one entry
        self.assertIn('priceHistory', product)
        self.assertEqual(len(product['priceHistory']), 1)
        
        # Should have basic analysis
        self.assertIn('priceAnalysis', product)

if __name__ == '__main__':
    # Ensure the tests directory exists
    os.makedirs('tests', exist_ok=True)
    
    # Run the tests
    unittest.main(verbosity=2)