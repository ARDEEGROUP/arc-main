/* enquire-submit.js
   Load AFTER forms.js. It takes over the submit of every .arc-form and sends it to /api/enquire.
   Tabs and everything else in forms.js keep working. */
(function () {
  var ENDPOINT = "/api/enquire";

  // Honeypot field (bots fill it, people never see it)
  function addHoneypot() {
    document.querySelectorAll("form.arc-form").forEach(function (f) {
      if (f.querySelector('input[name="website"]')) return;
      var h = document.createElement("input");
      h.type = "text";
      h.name = "website";
      h.tabIndex = -1;
      h.autocomplete = "off";
      h.setAttribute("aria-hidden", "true");
      h.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
      f.appendChild(h);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addHoneypot);
  else addHoneypot();

  function labelFor(form, el) {
    var l = el.id && form.querySelector('label[for="' + el.id + '"]');
    if (!l) return el.name;
    var c = l.cloneNode(true);
    c.querySelectorAll(".opt").forEach(function (n) { n.remove(); });
    return c.textContent.trim() || el.name;
  }

  function collect(form) {
    var out = [], seen = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.name || el.name === "consent" || el.name === "website" || el.type === "submit") return;
      if (el.type === "checkbox") {
        if (!el.checked) return;
        var key = el.name;
        if (!seen[key]) { seen[key] = { label: el.closest("fieldset") ? el.closest("fieldset").querySelector(".legend").textContent.trim() : key, value: [] }; out.push(seen[key]); }
        seen[key].value.push(el.value);
        return;
      }
      var v = (el.value || "").trim();
      if (v) out.push({ label: labelFor(form, el), value: v });
    });
    out.forEach(function (o) { if (Array.isArray(o.value)) o.value = o.value.join(", "); });
    return out;
  }

  function validate(form) {
    var els = form.querySelectorAll("[required]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === "checkbox") {
        if (!el.checked) return { el: el, msg: "Please tick the consent box so we can contact you." };
      } else if (!(el.value || "").trim()) {
        return { el: el, msg: "Please fill in: " + labelFor(form, el) + "." };
      }
    }
    var mob = form.querySelector('input[type="tel"]');
    if (mob && mob.value.replace(/\D/g, "").length < 10) return { el: mob, msg: "Please enter a valid mobile number." };
    var em = form.querySelector('input[type="email"]');
    if (em && em.value.trim() && !/^\S+@\S+\.\S+$/.test(em.value.trim())) return { el: em, msg: "Please enter a valid email address." };
    return null;
  }

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches("form.arc-form")) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // replaces the old submit behaviour from forms.js

    var err = form.querySelector(".err-msg");
    var btn = form.querySelector('button[type="submit"]');
    function showErr(m) { if (err) { err.textContent = m; err.hidden = false; } }
    if (err) err.hidden = true;

    var bad = validate(form);
    if (bad) { showErr(bad.msg); bad.el.focus(); return; }

    var oldHTML = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Sending...";

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: form.dataset.form,
        website: (form.querySelector('input[name="website"]') || {}).value || "",
        fields: collect(form),
      }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error("send failed");
        var done = document.createElement("div");
        done.setAttribute("role", "status");
        done.style.cssText = "padding:28px 0;display:grid;gap:10px";
        done.innerHTML =
          '<h3 style="font-family:var(--display);text-transform:uppercase;font-weight:400;font-size:30px;line-height:1">Thank <span class="it">you</span></h3>' +
          '<p style="color:var(--muted);line-height:1.7">We have your enquiry. Our team will get in touch with you shortly.</p>';
        form.replaceWith(done);
      })
      .catch(function () {
        btn.disabled = false;
        btn.innerHTML = oldHTML;
        showErr("Sorry, something went wrong. Please try again, or write to bd@ardeeracquetclub.com.");
      });
  }, true);
})();