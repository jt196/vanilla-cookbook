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
        // Store before super.onCreate() so SharedPreferences are written
        // before the Capacitor WebView starts loading and JS runs
        storePendingShare(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        storePendingShare(intent);
        // Bridge is ready when onNewIntent fires (app was already running),
        // so notify JS directly rather than waiting for a page reload
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text != null && !text.isEmpty() && getBridge() != null && getBridge().getWebView() != null) {
            String escaped = text.replace("\\", "\\\\").replace("'", "\\'");
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('vanillaCookbookShare',{detail:{text:'" + escaped + "'}}));",
                    null
                )
            );
        }
    }

    private void storePendingShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;
        getSharedPreferences(PREFS_GROUP, MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_SHARE, text)
            .apply();
    }
}
