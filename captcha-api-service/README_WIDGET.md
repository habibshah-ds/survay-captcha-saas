# CAPTCHA Widget — Embed Instructions

Add this to your HTML page (replace SITE_KEY with the site key provided in your dashboard):

```html
<link rel="stylesheet" href="https://your-domain.example/public/widget/captcha-widget.css">
<script src="https://your-domain.example/public/widget/captcha-widget.js" data-sitekey="SITE_KEY"></script>

<!-- Option A: auto-init via data-sitekey attribute -->
<!-- The script will automatically create a widget element next to the script tag. -->

<!-- Option B: manual init -->
<div id="captcha-container"></div>
<script>
  Captcha.init({
    siteKey: 'SITE_KEY',
    container: document.getElementById('captcha-container'),
    injectInputName: 'captcha_token', // optional: name of hidden input to add to nearest form
    onSuccess: function (token) {
      console.log('token:', token);
      // optionally send token to your server for server-to-server verification
    }
  });
</script>
