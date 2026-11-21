package com.minirinth.app;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setUserAgentString(
            settings.getUserAgentString() + " Minirinth/0.1.2 (Unofficial mobile port for Modrinth)"
        );
    }
}
