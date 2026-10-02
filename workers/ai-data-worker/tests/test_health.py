from ai_nexus_worker.health import health


def test_health_contract() -> None:
    assert health() == {"status": "ok", "service": "ai-data-worker"}
