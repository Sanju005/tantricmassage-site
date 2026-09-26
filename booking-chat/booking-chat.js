(function () {
  "use strict";

  var CONFIG = {
    supabaseUrl: "https://kejtfhaxrlvlckfrviju.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanRmaGF4cmx2bGNrZnJ2aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNzM4NTQsImV4cCI6MjEwNTk0OTg1NH0.byzaHKFFKU5fGZOL6RKhMH2eXoeKwD-X1E9uTX5KrfI",
    vapidPublicKey: "BPhHp0fcc0ZMwsNH4nl1W9j7TtVrWk65sJIkfLSLRrIJ1eFeIo1tcs4hM-ERMpeGZimOt89CEyDYmhjIxSJYCnk",
    telegramUser: "tantric_pro",
    sdkUrl: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js",
    startedKey: "mkl-chat-started"
  };

  var whatsappLink = document.getElementById("modal-whatsapp-link");
  if (!whatsappLink) return;

  var path = location.pathname;
  var audience = /couple/i.test(path) ? "Couple" : /male-packages/i.test(path) && !/female|lady/i.test(path) ? "Male" : "Lady";
  var params = new URLSearchParams(location.search);

  function text(id) {
    var el = document.getElementById(id);
    return el ? el.textContent.trim() : "";
  }

  function packageInfo() {
    var kicker = text("modal-package-kicker").toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return {
      name: kicker || "Package",
      duration: params.get("duration") || text("modal-package-duration"),
      price: text("modal-package-price"),
      area: params.get("area") || ""
    };
  }

  function bookingMessage(info) {
    var lines = ["Hi, I would like to book the " + info.name + " for " + audience + "."];
    if (info.duration) lines.push("Duration: " + info.duration);
    if (info.price) lines.push("Price: " + info.price);
    if (info.area) lines.push("Area: " + info.area);
    return lines.join("\n");
  }

  /* ---------- sound ---------- */
  var audioCtx = null;
  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { /* audio unavailable */ }
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
    document.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });
  function ding() {
    if (!audioCtx) return;
    try {
      var t = audioCtx.currentTime;
      [880, 1175].forEach(function (freq, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        var start = t + i * 0.13;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e) { /* ignore */ }
  }

  /* ---------- three-button chooser ---------- */
  var group = document.createElement("div");
  group.className = "bc-group";
  group.innerHTML =
    '<p class="bc-group-title">Choose how to message us</p>' +
    '<button type="button" class="package-button bc-btn bc-btn-tg">Book via Telegram</button>' +
    '<button type="button" class="package-button bc-btn bc-btn-chat">Book via Private Message</button>' +
    '<p class="bc-toast" role="status" aria-live="polite" hidden></p>';
  whatsappLink.parentNode.insertBefore(group, whatsappLink.nextSibling);

  var toast = group.querySelector(".bc-toast");
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.hidden = true; }, 6000);
  }

  function syncButtons() {
    var isCustom = /customize/i.test(whatsappLink.getAttribute("href") || "");
    group.hidden = isCustom;
    if (!isCustom && whatsappLink.textContent.trim() !== "Book via WhatsApp") {
      whatsappLink.textContent = "Book via WhatsApp";
    }
  }
  new MutationObserver(syncButtons).observe(whatsappLink, { attributes: true, attributeFilter: ["href"], childList: true, characterData: true });
  syncButtons();

  group.querySelector(".bc-btn-tg").addEventListener("click", function () {
    var msg = bookingMessage(packageInfo());
    var url = "https://t.me/" + CONFIG.telegramUser;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(
        function () { showToast("Booking details copied. Paste them into Telegram and send."); },
        function () { showToast("Open Telegram and tell us which package you want."); }
      );
    } else {
      showToast("Open Telegram and tell us which package you want.");
    }
    window.open(url, "_blank", "noopener");
  });

  group.querySelector(".bc-btn-chat").addEventListener("click", function () {
    openChat(packageInfo());
  });

  /* ---------- supabase client ---------- */
  var chat = null;
  var sdkPromise = null;
  var clientPromise = null;

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (!sdkPromise) {
      sdkPromise = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = CONFIG.sdkUrl;
        s.onload = resolve;
        s.onerror = function () { sdkPromise = null; reject(new Error("sdk")); };
        document.head.appendChild(s);
      });
    }
    return sdkPromise;
  }

  function getClient() {
    if (!clientPromise) {
      clientPromise = loadSdk().then(function () {
        var client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: "mkl-chat-auth" }
        });
        return client.auth.getSession().then(function (r) {
          if (r.data && r.data.session) return client;
          return client.auth.signInAnonymously().then(function (res) {
            if (res.error) throw res.error;
            return client;
          });
        });
      }).catch(function (e) { clientPromise = null; throw e; });
    }
    return clientPromise;
  }

  /* ---------- chat UI ---------- */
  function buildChat() {
    var el = document.createElement("div");
    el.className = "bc-overlay";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="bc-panel" role="dialog" aria-modal="true" aria-label="Private message">' +
        '<div class="bc-head">' +
          '<div><p class="bc-head-title">Private Message</p><p class="bc-head-sub">Only you and we can see this chat</p></div>' +
          '<button type="button" class="bc-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="bc-summary"></div>' +
        '<div class="bc-push" hidden></div>' +
        '<div class="bc-messages" aria-live="polite"></div>' +
        '<div class="bc-contact">' +
          '<label for="bc-contact-input">Optional: how can we reach you if you leave this page?</label>' +
          '<input id="bc-contact-input" type="text" maxlength="200" placeholder="WhatsApp, Telegram or email">' +
        '</div>' +
        '<p class="bc-error" hidden></p>' +
        '<div class="bc-file" hidden><span class="bc-file-name"></span><button type="button" class="bc-file-remove" aria-label="Remove photo">&times;</button></div>' +
        '<form class="bc-form">' +
          '<button type="button" class="bc-attach" aria-label="Attach photo" title="Attach photo">&#128206;</button>' +
          '<input type="file" class="bc-file-input" accept="image/*,.heic,.heif" hidden>' +
          '<textarea class="bc-input" rows="3" maxlength="2000" aria-label="Your message"></textarea>' +
          '<button type="submit" class="bc-send">Send</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(el);

    var api = {
      el: el,
      summary: el.querySelector(".bc-summary"),
      push: el.querySelector(".bc-push"),
      list: el.querySelector(".bc-messages"),
      contactBox: el.querySelector(".bc-contact"),
      contact: el.querySelector("#bc-contact-input"),
      error: el.querySelector(".bc-error"),
      fileBar: el.querySelector(".bc-file"),
      fileName: el.querySelector(".bc-file-name"),
      fileInput: el.querySelector(".bc-file-input"),
      form: el.querySelector(".bc-form"),
      input: el.querySelector(".bc-input"),
      send: el.querySelector(".bc-send"),
      client: null,
      connecting: null,
      conversationId: null,
      rows: {},
      channel: null,
      file: null,
      notedReply: false,
      pushBarDone: false
    };

    el.querySelector(".bc-close").addEventListener("click", closeChat);
    el.addEventListener("click", function (e) { if (e.target === el) closeChat(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && el.classList.contains("is-open")) closeChat(); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden && isOpen()) { markRead(); refreshStatuses(); } });
    api.form.addEventListener("submit", function (e) { e.preventDefault(); unlockAudio(); sendMessage(); });
    api.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); }
    });
    el.querySelector(".bc-attach").addEventListener("click", function () { api.fileInput.click(); });
    api.fileInput.addEventListener("change", function () {
      var f = api.fileInput.files && api.fileInput.files[0];
      api.fileInput.value = "";
      if (!f) return;
      if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|gif|bmp|hei[cf])$/i.test(f.name)) { setError("Please choose a photo."); return; }
      if (f.size > 20 * 1024 * 1024) { setError("That photo is too large."); return; }
      setError("");
      api.file = f;
      api.fileName.textContent = f.name;
      api.fileBar.hidden = false;
    });
    el.querySelector(".bc-file-remove").addEventListener("click", clearFile);
    return api;
  }

  function clearFile() {
    chat.file = null;
    chat.fileBar.hidden = true;
  }

  function isOpen() {
    return !!chat && chat.el.classList.contains("is-open") && !document.hidden;
  }

  function setError(msg) {
    chat.error.textContent = msg || "";
    chat.error.hidden = !msg;
  }

  function statusLabel(m) {
    if (m.read_at) return { text: "✓✓ Read", cls: "is-read" };
    if (m.delivered_at) return { text: "✓✓ Delivered", cls: "" };
    return { text: "✓ Sent", cls: "" };
  }

  function updateStatus(m) {
    var r = chat.rows[m.id];
    if (!r || !r.status) return;
    var s = statusLabel(m);
    r.status.textContent = s.text;
    r.status.className = "bc-status " + s.cls;
  }

  function loadImage(img, storagePath) {
    chat.client.storage.from("chat-images").createSignedUrl(storagePath, 3600).then(function (r) {
      if (!r.data || !r.data.signedUrl) return;
      var url = r.data.signedUrl;
      img.src = url;
      img.addEventListener("click", function () { window.open(url, "_blank", "noopener"); });
    });
  }

  function addMessage(m, live) {
    if (chat.rows[m.id]) { updateStatus(m); return; }
    var mine = m.sender !== "admin";
    var row = document.createElement("div");
    row.className = "bc-msg bc-msg-" + (mine ? "me" : "them");
    var bubble = document.createElement("div");
    bubble.className = "bc-bubble";
    if (m.image_path) {
      var img = document.createElement("img");
      img.className = "bc-img";
      img.alt = "Photo";
      bubble.appendChild(img);
      loadImage(img, m.image_path);
    }
    if (m.body) {
      var body = document.createElement("div");
      body.textContent = m.body;
      bubble.appendChild(body);
    }
    var meta = document.createElement("span");
    meta.className = "bc-time";
    meta.appendChild(document.createTextNode(new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
    var status = null;
    if (mine) {
      status = document.createElement("span");
      meta.appendChild(document.createTextNode(" "));
      meta.appendChild(status);
    }
    bubble.appendChild(meta);
    row.appendChild(bubble);
    chat.list.appendChild(row);
    chat.rows[m.id] = { status: status, el: row, created: m.created_at };
    if (mine) updateStatus(m);
    chat.list.scrollTop = chat.list.scrollHeight;
    if (live && !mine) {
      ding();
      if (isOpen()) markRead(); else markDelivered();
    }
  }

  function markRead() {
    if (chat && chat.client && chat.conversationId) chat.client.rpc("mark_messages", { conv: chat.conversationId, kind: "read" });
  }
  function markDelivered() {
    if (chat && chat.client && chat.conversationId) chat.client.rpc("mark_messages", { conv: chat.conversationId, kind: "delivered" });
  }

  function removeRow(id) {
    var r = chat.rows[id];
    if (!r) return;
    if (r.el) r.el.remove();
    delete chat.rows[id];
  }

  function resetConversation() {
    if (chat.channel) { chat.client.removeChannel(chat.channel); chat.channel = null; }
    if (chat.poll) { clearInterval(chat.poll); chat.poll = null; }
    chat.conversationId = null;
    chat.rows = {};
    chat.list.innerHTML = "";
    chat.contactBox.hidden = false;
    chat.notedReply = false;
    try { localStorage.removeItem(CONFIG.startedKey); } catch (e) { /* ignore */ }
  }

  function refreshStatuses() {
    if (!chat.client || !chat.conversationId) return;
    var cid = chat.conversationId;
    chat.client.from("messages").select("id, delivered_at, read_at").eq("conversation_id", cid).limit(500)
      .then(function (r) {
        if (r.error || !r.data || chat.conversationId !== cid) return;
        var live = {};
        r.data.forEach(function (m) { live[m.id] = true; updateStatus(m); });
        Object.keys(chat.rows).forEach(function (id) {
          var age = Date.now() - new Date(chat.rows[id].created).getTime();
          if (!live[id] && age > 15000) removeRow(id);
        });
        if (!r.data.length) {
          chat.client.from("conversations").select("id").eq("id", cid).maybeSingle().then(function (c) {
            if (!c.error && !c.data && chat.conversationId === cid) resetConversation();
          });
        }
      });
  }

  function subscribe() {
    if (chat.channel || !chat.conversationId) return;
    if (!chat.poll) chat.poll = setInterval(function () { if (isOpen()) refreshStatuses(); }, 8000);
    var filter = "conversation_id=eq." + chat.conversationId;
    chat.channel = chat.client
      .channel("chat-" + chat.conversationId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: filter },
        function (payload) { addMessage(payload.new, true); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: filter },
        function (payload) { updateStatus(payload.new); })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" },
        function (payload) { if (payload.old && payload.old.id) removeRow(payload.old.id); })
      .subscribe();
  }

  function loadExisting() {
    return chat.client
      .from("conversations").select("id").order("last_message_at", { ascending: false }).limit(1)
      .then(function (r) {
        if (r.error) throw r.error;
        if (!r.data || !r.data.length) return;
        chat.conversationId = r.data[0].id;
        chat.contactBox.hidden = true;
        return chat.client.from("messages").select("*").eq("conversation_id", chat.conversationId)
          .order("created_at", { ascending: true }).limit(200)
          .then(function (m) {
            if (m.error) throw m.error;
            m.data.forEach(function (x) { addMessage(x, false); });
            subscribe();
            if (isOpen()) markRead(); else markDelivered();
          });
      });
  }

  function connect() {
    if (chat.client) return Promise.resolve();
    if (!chat.connecting) {
      chat.connecting = getClient().then(function (client) {
        chat.client = client;
        return loadExisting();
      }).catch(function (e) {
        chat.client = null;
        chat.connecting = null;
        throw e;
      });
    }
    return chat.connecting;
  }

  /* ---------- push notifications ---------- */
  function b64ToBytes(b64) {
    var pad = "=".repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function saveSubscription() {
    return navigator.serviceWorker.register("/sw-chat.js").then(function () {
      return navigator.serviceWorker.ready;
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(CONFIG.vapidPublicKey) });
      });
    }).then(function (sub) {
      return chat.client.auth.getSession().then(function (s) {
        var pageUrl = new URL(location.href);
        pageUrl.searchParams.delete("chat");
        return chat.client.from("push_subscriptions").upsert(
          { endpoint: sub.endpoint, user_id: s.data.session.user.id, subscription: sub.toJSON(), page_url: pageUrl.toString() },
          { onConflict: "endpoint,user_id" }
        );
      });
    });
  }

  function setupPushBar() {
    if (chat.pushBarDone) return;
    chat.pushBarDone = true;
    var bar = chat.push;
    var supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

    if (!supported) {
      if (ios && !standalone) {
        bar.textContent = "For reply alerts on iPhone: tap Share, then Add to Home Screen, and open this site from your Home Screen.";
        bar.hidden = false;
      }
      return;
    }
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") {
      saveSubscription().catch(function () { /* keep chat working */ });
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bc-push-btn";
    btn.textContent = "Get a notification when we reply";
    btn.addEventListener("click", function () {
      Notification.requestPermission().then(function (perm) {
        if (perm !== "granted") { bar.hidden = true; return; }
        return saveSubscription().then(function () {
          bar.textContent = "Notifications are on. You will be alerted when we reply, even if you close this page.";
        });
      }).catch(function () {
        bar.textContent = "Notifications could not be turned on in this browser.";
      });
    });
    bar.appendChild(btn);
    bar.hidden = false;
  }

  /* ---------- open / close / send ---------- */
  function openChat(info) {
    if (!chat) chat = buildChat();
    unlockAudio();
    chat.summary.innerHTML = "";
    chat.summary.hidden = !info;
    if (info) {
      var title = document.createElement("strong");
      title.textContent = info.name + " (" + audience + ")";
      chat.summary.appendChild(title);
      [info.duration && "Duration: " + info.duration, info.price && "Price: " + info.price, info.area && "Area: " + info.area]
        .filter(Boolean)
        .forEach(function (line) {
          var p = document.createElement("span");
          p.textContent = line;
          chat.summary.appendChild(p);
        });
      chat.input.value = bookingMessage(info);
    } else {
      chat.input.value = "";
    }
    setError("");
    chat.el.classList.add("is-open");
    chat.el.setAttribute("aria-hidden", "false");
    document.body.classList.add("bc-noscroll");
    chat.input.focus();

    if (chat.client) {
      setupPushBar();
      markRead();
      return;
    }
    chat.send.disabled = true;
    connect().then(function () {
      chat.send.disabled = false;
      setupPushBar();
      markRead();
    }).catch(function () {
      setError("Private chat is unavailable right now. Please use WhatsApp or Telegram.");
      chat.send.disabled = false;
    });
  }

  function closeChat() {
    if (!chat) return;
    chat.el.classList.remove("is-open");
    chat.el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("bc-noscroll");
  }

  function isHeic(file) {
    return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
  }

  function decodeImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function loadHeicConverter() {
    if (window.heic2any) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
      s.onload = resolve;
      s.onerror = function () { reject(new Error("decode")); };
      document.head.appendChild(s);
    });
  }

  function toDrawable(file) {
    return decodeImage(file).catch(function () {
      if (!window.createImageBitmap) throw new Error("decode");
      return createImageBitmap(file).catch(function () { throw new Error("decode"); });
    }).catch(function (err) {
      if (!isHeic(file)) throw err;
      return loadHeicConverter()
        .then(function () { return window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 }); })
        .then(function (out) { return decodeImage(Array.isArray(out) ? out[0] : out); })
        .catch(function () { throw new Error("decode"); });
    });
  }

  function compressImage(file) {
    return toDrawable(file).then(function (src) {
      var w = src.naturalWidth || src.width;
      var h = src.naturalHeight || src.height;
      var scale = Math.min(1, 1600 / Math.max(w, h));
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.getContext("2d").drawImage(src, 0, 0, canvas.width, canvas.height);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("decode")); }, "image/jpeg", 0.82);
      });
    });
  }

  function sendMessage() {
    var body = chat.input.value.trim();
    var file = chat.file;
    if (!body && !file) return;
    if (!chat.client) { setError("Still connecting. Please try again in a moment."); return; }
    chat.send.disabled = true;
    setError("");

    var conversationId;
    var ready = chat.conversationId
      ? Promise.resolve(chat.conversationId)
      : chat.client.from("conversations")
          .insert({ contact: chat.contact.value.trim() || null })
          .select("id").single()
          .then(function (r) {
            if (r.error) throw r.error;
            chat.conversationId = r.data.id;
            chat.contactBox.hidden = true;
            try { localStorage.setItem(CONFIG.startedKey, "1"); } catch (e) { /* ignore */ }
            subscribe();
            return r.data.id;
          });

    ready.then(function (id) {
      conversationId = id;
      if (!file) return null;
      return compressImage(file).then(function (blob) {
        var objectPath = id + "/" + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)) + ".jpg";
        return chat.client.storage.from("chat-images").upload(objectPath, blob, { contentType: "image/jpeg", upsert: false })
          .then(function (u) {
            if (u.error) throw u.error;
            return objectPath;
          });
      });
    }).then(function (imagePath) {
      return chat.client.from("messages")
        .insert({ conversation_id: conversationId, sender: "customer", body: body, image_path: imagePath || null })
        .select("*").single();
    }).then(function (r) {
      if (r.error) throw r.error;
      addMessage(r.data, false);
      chat.input.value = "";
      clearFile();
      if (!chat.notedReply) {
        chat.notedReply = true;
        var note = document.createElement("p");
        note.className = "bc-note";
        note.textContent = "Message sent. We will reply here shortly.";
        chat.list.appendChild(note);
        chat.list.scrollTop = chat.list.scrollHeight;
      }
    }).catch(function (err) {
      var msg = err && err.message ? String(err.message) : "";
      if (msg === "decode") {
        setError("That photo could not be read. Please try another photo or a screenshot.");
      } else if (/chat_blocked/.test(msg)) {
        setError("Messaging is not available for this connection.");
      } else if ((err && (err.code === "23503" || err.code === "42501")) || /row-level security|foreign key/i.test(msg)) {
        resetConversation();
        setError("This chat was closed. Please send your message again.");
      } else {
        setError("Message could not be sent. Please try again, or use WhatsApp or Telegram.");
      }
    }).then(function () {
      chat.send.disabled = false;
    });
  }

  /* ---------- startup ---------- */
  var started = false;
  try { started = localStorage.getItem(CONFIG.startedKey) === "1"; } catch (e) { /* ignore */ }

  if (params.get("chat") === "open") {
    var clean = new URL(location.href);
    clean.searchParams.delete("chat");
    history.replaceState(null, "", clean.toString());
    openChat(null);
  } else if (started) {
    chat = buildChat();
    connect().catch(function () { /* stay quiet until the customer opens the chat */ });
  }
})();
