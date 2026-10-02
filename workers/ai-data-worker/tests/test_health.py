import unittest

from ai_nexus_worker.health import health


class HealthTest(unittest.TestCase):
    def test_health_contract(self) -> None:
        self.assertEqual(health(), {"status": "ok", "service": "ai-data-worker"})


if __name__ == "__main__":
    unittest.main()
