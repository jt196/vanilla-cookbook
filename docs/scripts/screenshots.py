from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
import os
import re

# Load .env
load_dotenv(override=True)
USERNAME = os.getenv("ADMIN_USER")
PASSWORD = os.getenv("ADMIN_PASSWORD")
ID = os.getenv("ADMIN_ID")
ORIGIN = os.getenv("ORIGIN", "http://localhost:5173")
ONLY_RECIPE = os.getenv("ONLY_RECIPE") in ("1", "true", "yes", "on")

LOGIN_URL = f"{ORIGIN}/login"
RECIPE_LIST = re.compile(fr"{re.escape(ORIGIN)}/user/.+/recipes")

PAGES_TO_CAPTURE = [
    {"name": "login", "route": "/login"},
    {"name": "new", "route": "/recipe/new"},
    {"name": "shopping", "route": "/user/{ID}/shopping"},
    {"name": "calendar", "route": "/user/{ID}/calendar"},
    {"name": "settings", "route": "/user/{ID}/options/settings"},
    {"name": "password", "route": "/user/{ID}/options/password"},
    {"name": "bookmark", "route": "/user/{ID}/options/bookmark"},
    {"name": "import", "route": "/user/{ID}/options/import"},
    {"name": "export", "route": "/user/{ID}/options/export"},
    {"name": "upload", "route": "/user/{ID}/options/upload"},
    {"name": "admin-users", "route": "/user/{ID}/options/admin/users"},
    {"name": "admin-site", "route": "/user/{ID}/options/admin/site"},
]

def capture_both_themes(page, url, image_name):
    print(f"📸 Navigating to {url}")
    page.goto(url)
    page.wait_for_load_state("networkidle")

    for _ in range(2):  # capture twice: current + toggled
        theme = page.get_attribute("html", "data-theme") or "light"
        themed_image = f"{image_name}-{theme}.png"
        print(f"🖼️ Capturing {themed_image}")
        page.screenshot(path=f"docs/images/{themed_image}")

        page.click('button[aria-label="Toggle theme"]')
        page.wait_for_timeout(500)

def run_capture(context, prefix):
    if not USERNAME or not PASSWORD:
        raise RuntimeError(
            "Missing credentials: set ADMIN_USER and ADMIN_PASSWORD in your environment/.env"
        )
    if not ID:
        raise RuntimeError("Missing ADMIN_ID in your environment/.env")

    page = context.new_page()

    # Login Page
    capture_both_themes(page, f"{ORIGIN}/login", f"{prefix}-login")

    # Login
    page.fill('input[name="username"]', USERNAME)
    page.fill('input[name="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url(RECIPE_LIST)
    page.wait_for_load_state("networkidle")

    # Recipe list
    capture_both_themes(page, page.url, f"{prefix}-list")

    # First recipe
    page.wait_for_selector("a.recipe-container")
    first_href = page.get_attribute("a.recipe-container", "href")
    first_url = f"{ORIGIN}{first_href}"
    capture_both_themes(page, first_url, f"{prefix}-first-recipe")

    if ONLY_RECIPE:
        # Short-circuit if we only want the recipe view.
        return

    # All other pages
    for item in PAGES_TO_CAPTURE:
        if item["name"] == "login":
            continue
        full_url = f"{ORIGIN}{item['route']}"
        image_name = f"{prefix}-{item['name']}"
        capture_both_themes(page, full_url, image_name)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # === Desktop
    desktop = browser.new_context(viewport={"width": 1280, "height": 800})
    run_capture(desktop, "screen-desktop")
    desktop.close()

    # === Mobile
    iphone = p.devices["iPhone 12"]
    mobile = browser.new_context(**iphone)
    run_capture(mobile, "screen-mobile")
    mobile.close()

    browser.close()

print("✅ All screenshots captured with both themes.")
