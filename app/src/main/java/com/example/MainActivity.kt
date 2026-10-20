package com.example

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Scaffold(
          modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
        ) { innerPadding ->
          WaveLabScreen(modifier = Modifier.fillMaxSize())
        }
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WaveLabScreen(modifier: Modifier = Modifier) {
  var webViewRef: WebView? = remember { null }

  BackHandler(enabled = webViewRef?.canGoBack() == true) {
    webViewRef?.goBack()
  }

  Box(modifier = modifier.testTag("wavelab_screen_container")) {
    AndroidView(
      modifier = Modifier
        .fillMaxSize()
        .testTag("wavelab_webview"),
      factory = { context ->
        WebView(context).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          setBackgroundColor(0xFF090D16.toInt())

          // Enable hardware acceleration for smooth 60 FPS Three.js rendering
          setLayerType(View.LAYER_TYPE_HARDWARE, null)

          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_NO_CACHE
            mediaPlaybackRequiresUserGesture = false
          }

          webChromeClient = WebChromeClient()
          webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
            }
          }

          loadUrl("file:///android_asset/wavelab/index.html")
          webViewRef = this
        }
      },
      update = { view ->
        webViewRef = view
      }
    )
  }
}
