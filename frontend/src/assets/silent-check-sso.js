// Separate JS to comply with CSP (no inline scripts)
(function(){
  try {
    parent.postMessage(window.location.href, window.location.origin);
  } catch (e) {
    // Fail silently; keycloak-js will treat lack of response as not authenticated
    console.error('silent-check-sso postMessage failed', e);
  }
})();