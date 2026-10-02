def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-data-worker"}


if __name__ == "__main__":
    print(health())
