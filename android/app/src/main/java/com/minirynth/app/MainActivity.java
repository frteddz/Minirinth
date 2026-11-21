package com.minirynth.app;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setUserAgentString(
            settings.getUserAgentString() + " Minirynth/0.2.1 (Unofficial mobile port for Modrinth)"
        );
    }
}
