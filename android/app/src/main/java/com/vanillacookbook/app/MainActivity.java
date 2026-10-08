package com.vanillacookbook.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Must match the SharedPreferences group used by @capacitor/preferences
    private static final String PREFS_GROUP = "CapacitorStorage";
    private static final String KEY_PENDING_SHARE = "pendingShare";
    private static final String KEY_SERVER = "serverUrl";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Store before super.onCreate() so SharedPreferences are written
        // before the Capacitor WebView starts loading and JS runs
        storePendingShare(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String text = getSharedText(intent);
        if (text == null) return;

        // The app is already running, so the setup page that normally consumes
        // pendingShare has usually been replaced by the server's pages.
        // Navigate straight to the new-recipe page instead.
        String serverUrl = getSharedPreferences(PREFS_GROUP, MODE_PRIVATE).getString(KEY_SERVER, null);
        if (serverUrl != null && !serverUrl.isEmpty() && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().loadUrl(buildShareUrl(serverUrl, text));
            return;
        }

        // No server configured yet: we're still on the setup page, so hand the
        // share over the usual way and reload so the setup page picks it up.
        storePendingShare(intent);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().reload();
        }
    }

    /** Mirrors navigateToServer() in android-web/index.html. */
    private static String buildShareUrl(String serverUrl, String text) {
        String param = text.matches("(?is)^https?://.*") ? "url" : "text";
        String base = serverUrl.replaceAll("/+$", "");
        try {
            return base + "/recipe/new?" + param + "=" + URLEncoder.encode(text, "UTF-8").replace("+", "%20");
        } catch (UnsupportedEncodingException e) {
            return base + "/recipe/new";
        }
    }

    private static String getSharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return null;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        return (text == null || text.isEmpty()) ? null : text;
    }

    private void storePendingShare(Intent intent) {
        String text = getSharedText(intent);
        if (text == null) return;
        getSharedPreferences(PREFS_GROUP, MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_SHARE, text)
            .apply();
    }
}
