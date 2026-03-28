package com.vanillacookbook.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Must match the SharedPreferences group used by @capacitor/preferences
    private static final String PREFS_GROUP = "CapacitorStorage";
    private static final String KEY_PENDING_SHARE = "pendingShare";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;

        // Store in the same SharedPreferences file that @capacitor/preferences reads,
        // so the JS setup page can pick it up via Capacitor.Plugins.Preferences.get()
        SharedPreferences prefs = getSharedPreferences(PREFS_GROUP, MODE_PRIVATE);
        prefs.edit().putString(KEY_PENDING_SHARE, text).apply();

        // If the bridge is already loaded (app was backgrounded), notify it directly
        // so the current page can act on the share without waiting for a reload
        if (getBridge() != null && getBridge().getWebView() != null) {
            String escaped = text.replace("\\", "\\\\").replace("'", "\\'");
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('vanillaCookbookShare',{detail:{text:'" + escaped + "'}}));",
                    null
                )
            );
        }
    }
}
