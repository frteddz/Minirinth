package com.minirynth.app;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;
import com.minirynth.app.plugins.LauncherFoldersPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LauncherFoldersPlugin.class);
        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setUserAgentString(
            settings.getUserAgentString() + " Minirynth/0.5.4-dev (Unofficial mobile client for Modrinth)"
        );
    }
}
