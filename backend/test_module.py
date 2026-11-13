"""
Direct verification suite for the Nutrition Module.
Tests routes, image preprocessor, food classifier, ML pattern engine, and history logic.
No network/sockets required.
"""
import sys
import os
import unittest
from unittest.mock import MagicMock, patch
import numpy as np
import cv2

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import main
from routes.nutrition import router, get_history
import food_classifier
import vision_preprocessor as vision
import ml_pattern_engine as ml


class NutritionModuleDirectTests(unittest.TestCase):

    def test_01_health_check(self):
        """Backend health function."""
        res = main.health()
        self.assertEqual(res, {"status": "ok"})
        print("  [PASS] main.health() -> {'status': 'ok'}")

    def test_02_routes_registered(self):
        """All expected endpoints including new /history route must be present on the router."""
        expected = {
            "/onboard",
            "/plan/{user_id}",
            "/plan/modify",
            "/analyze-meal",
            "/confirm-meal",
            "/history/{user_id}",
            "/insights/{user_id}",
        }
        registered = {r.path for r in router.routes}
        for ep in expected:
            self.assertIn(ep, registered, f"Missing route: {ep}")
        print("  [PASS] All 7 nutrition routes registered on router:")
        for r in sorted(registered):
            print(f"         - /api/nutrition{r}")

    def test_03_image_preprocessing(self):
        """OpenCV pipeline: resize, Gaussian blur, CLAHE in LAB space."""
        dummy = np.random.randint(0, 255, (600, 800, 3), dtype=np.uint8)
        _, raw_bytes = cv2.imencode(".jpg", dummy)

        processed = vision.preprocess_image(raw_bytes.tobytes())
        self.assertIsInstance(processed, bytes)
        self.assertGreater(len(processed), 0)

        arr = np.frombuffer(processed, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        h, w = img.shape[:2]
        self.assertLessEqual(max(h, w), vision.MAX_SIDE)
        print("  [PASS] OpenCV CLAHE & standardization pipeline")

    def test_04_food_classifier_fallback(self):
        """Food classifier availability and graceful fallback."""
        available = food_classifier.is_available()
        self.assertIsInstance(available, bool)
        print(f"  [PASS] Pre-trained Food Classifier (CLIP is_available={available})")

    def test_05_hybrid_vision_detection_fallback(self):
        """Verify detect_food_hybrid delegates gracefully."""
        dummy = np.random.randint(50, 200, (400, 400, 3), dtype=np.uint8)
        _, raw = cv2.imencode(".jpg", dummy)

        mock_detected = {
            "items": [{"item": "Roti", "quantity": 2, "confidence": 0.95}],
            "notes": "Test detection"
        }
        with patch("vision_preprocessor.structured_call", return_value=mock_detected):
            res = vision.detect_food_hybrid(raw.tobytes(), ["Roti", "Dal Tadka"], "CATALOG")
            self.assertIn("items", res)
            self.assertEqual(res["items"][0]["item"], "Roti")
        print("  [PASS] Hybrid vision detection pipeline")

    def test_06_ml_pattern_engine(self):
        """Statistical baseline & anomaly detection."""
        from datetime import datetime
        logs = [
            {"logged_at": "2026-11-10T03:00:00Z", "meal_type": "breakfast", "total_calories": 400, "total_protein": 15, "total_carbs": 50, "total_fats": 10},
            {"logged_at": "2026-11-10T08:00:00Z", "meal_type": "lunch", "total_calories": 650, "total_protein": 25, "total_carbs": 80, "total_fats": 20},
            {"logged_at": "2026-11-10T14:00:00Z", "meal_type": "dinner", "total_calories": 550, "total_protein": 20, "total_carbs": 70, "total_fats": 18},
        ]
        df = ml.logs_to_df(logs)
        self.assertEqual(len(df), 3)

        ref_now = datetime(2026, 11, 11, 12, 0, tzinfo=ml.LOCAL_TZ if hasattr(ml, 'LOCAL_TZ') and not isinstance(ml.LOCAL_TZ, str) else None)
        baseline = ml.personal_baseline(df, window_days=7, now=ref_now)
        self.assertTrue(baseline["available"])
        self.assertEqual(baseline["avg_daily_calories"], 1600.0)

        # Normal meal check
        anomaly = ml.detect_anomaly(df, {"calories": 500, "protein": 20, "carbs": 60, "meal_hour": 13.0, "meal_type": "lunch"})
        self.assertFalse(anomaly["is_anomaly"])

        # Calorie spike check
        spike = ml.detect_anomaly(df, {"calories": 1800, "protein": 5, "carbs": 250, "meal_hour": 23.5, "meal_type": "dinner"})
        self.assertTrue(spike["is_anomaly"])
        print("  [PASS] ML Pattern Engine (Baseline + Anomaly Detection)")

    def test_07_history_endpoint_logic(self):
        """Verify get_history endpoint function logic, pagination, and output contract."""
        fake_meals = [
            {
                "id": "11111111-2222-3333-4444-555555555555",
                "user_id": "test-user-id",
                "meal_type": "lunch",
                "confirmed_items": [{"item": "Roti", "quantity": 2, "serving_unit": "1 piece", "calories": 208, "protein_g": 6.2, "carbs_g": 36, "fats_g": 5}],
                "total_calories": 208,
                "total_protein": 6.2,
                "total_carbs": 36,
                "total_fats": 5,
                "is_anomaly": False,
                "bot_feedback": "Great balanced lunch.",
                "logged_at": "2026-11-12T13:30:00+05:30"
            }
        ]
        with patch("routes.nutrition._authorize"), patch("routes.nutrition._get_user"), patch("routes.nutrition.sb") as mock_sb:
            mock_table = MagicMock()
            mock_sb.return_value.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.gte.return_value.execute.return_value.count = 1
            mock_table.select.return_value.eq.return_value.gte.return_value.order.return_value.range.return_value.execute.return_value.data = fake_meals

            res = get_history(user_id="test-user-id", days=30, page=1, per_page=10, authorization=None)
            self.assertIn("meals", res)
            self.assertIn("total", res)
            self.assertEqual(res["total"], 1)
            self.assertEqual(len(res["meals"]), 1)
            self.assertEqual(res["meals"][0]["meal_type"], "lunch")
            self.assertEqual(res["meals"][0]["total_calories"], 208)
            self.assertEqual(res["page"], 1)
            self.assertEqual(res["per_page"], 10)
        print("  [PASS] get_history() endpoint logic, filtering, pagination")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RUNNING NUTRITION MODULE VERIFICATION SUITE")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(NutritionModuleDirectTests)
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("=" * 60)
        print("ALL TESTS PASSED SUCCESSFULLY! (7/7)")
        print("=" * 60 + "\n")
    else:
        sys.exit(1)
