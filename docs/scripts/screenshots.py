from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
import os
import re

# Load .env with override
load_dotenv(override=True)
USERNAME = os.getenv("ADMIN_USER")
PASSWORD = os.getenv("ADMIN_PASSWORD")
ORIGIN = os.getenv("ORIGIN", "http://localhost:5173")

LOGIN_URL = f"{ORIGIN}/login"
RECIPE_LIST = re.compile(fr"{re.escape(ORIGIN)}/user/.+/recipes")

# Named routes with login
PAGES_TO_CAPTURE = [
    {"name": "login", "route": "/login"},
    {"name": "new", "route": "/new"},
    {"name": "shopping", "route": "/user/shopping"},
    {"name": "calendar", "route": "/user/calendar"},
    {"name": "settings", "route": "/user/options/settings"},
    {"name": "password", "route": "/user/options/password"},
    {"name": "bookmark", "route": "/user/options/bookmark"},
    {"name": "import", "route": "/user/options/import"},
    {"name": "export", "route": "/user/options/export"},
    {"name": "upload", "route": "/user/options/upload"},
    {"name": "admin-users", "route": "/user/options/admin/users"},
    {"name": "admin-site", "route": "/user/options/admin/site"},
]

def capture_page_screenshot(page, url, image_name):
    print(f"📸 Capturing {image_name} at {url}")
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"docs/images/{image_name}.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # === Desktop Context ===
    context_desktop = browser.new_context(viewport={"width": 1280, "height": 800}, color_scheme="dark")
    page_desktop = context_desktop.new_page()

    # --- Capture Login Page BEFORE login ---
    login_page = next((item for item in PAGES_TO_CAPTURE if item['name'] == "login"), None)
    if login_page:
        login_url = f"{ORIGIN}{login_page['route']}"
        capture_page_screenshot(page_desktop, login_url, "screen-login-large")

    # --- Login ---
    page_desktop.fill('input[name="username"]', USERNAME)
    page_desktop.fill('input[name="password"]', PASSWORD)
    page_desktop.click('button[type="submit"]')
    page_desktop.wait_for_url(RECIPE_LIST)
    page_desktop.wait_for_load_state("networkidle")

    capture_page_screenshot(page_desktop, page_desktop.url, "screen-list-large")

    # Get first recipe URL ONCE
    page_desktop.wait_for_selector("a.recipe-container")
    first_recipe_href = page_desktop.get_attribute("a.recipe-container", "href")
    first_recipe_url = f"{ORIGIN}{first_recipe_href}"
    capture_page_screenshot(page_desktop, first_recipe_url, "screen-first-recipe-large")

    # Desktop: Loop through non-login pages
    for item in PAGES_TO_CAPTURE:
        if item['name'] == "login":
            continue  # Already handled
        full_url = f"{ORIGIN}{item['route']}"
        image_name = f"screen-{item['name']}-large"
        capture_page_screenshot(page_desktop, full_url, image_name)

    # === Mobile Context ===
    iphone = p.devices["iPhone 12"]
    context_mobile = browser.new_context(**iphone, color_scheme="dark")
    page_mobile = context_mobile.new_page()

    # Capture login page (mobile)
    if login_page:
        login_url = f"{ORIGIN}{login_page['route']}"
        capture_page_screenshot(page_mobile, login_url, "screen-login-mobile")

    # Login (mobile)
    page_mobile.fill('input[name="username"]', USERNAME)
    page_mobile.fill('input[name="password"]', PASSWORD)
    page_mobile.click('button[type="submit"]')
    page_mobile.wait_for_url(RECIPE_LIST)
    page_mobile.wait_for_load_state("networkidle")

    capture_page_screenshot(page_mobile, page_mobile.url, "screen-list-mobile")
    capture_page_screenshot(page_mobile, first_recipe_url, "screen-first-recipe-mobile")

    # Mobile: Loop through non-login pages
    for item in PAGES_TO_CAPTURE:
        if item['name'] == "login":
            continue
        full_url = f"{ORIGIN}{item['route']}"
        image_name = f"screen-{item['name']}-mobile"
        capture_page_screenshot(page_mobile, full_url, image_name)

    browser.close()

print("✅ All screenshots captured successfully.")