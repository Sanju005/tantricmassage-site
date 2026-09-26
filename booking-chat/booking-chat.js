(function () {
  "use strict";

  var CONFIG = {
    supabaseUrl: "https://kejtfhaxrlvlckfrviju.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanRmaGF4cmx2bGNrZnJ2aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNzM4NTQsImV4cCI6MjEwNTk0OTg1NH0.byzaHKFFKU5fGZOL6RKhMH2eXoeKwD-X1E9uTX5KrfI",
    telegramUser: "tantric_pro",
    sdkUrl: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"
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

  /* ---------- private chat ---------- */
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
        '<div class="bc-messages" aria-live="polite"></div>' +
        '<div class="bc-contact">' +
          '<label for="bc-contact-input">Optional: how can we reach you if you leave this page?</label>' +
          '<input id="bc-contact-input" type="text" maxlength="200" placeholder="WhatsApp, Telegram or email">' +
        '</div>' +
        '<p class="bc-error" hidden></p>' +
        '<form class="bc-form">' +
          '<textarea class="bc-input" rows="4" maxlength="2000" aria-label="Your message"></textarea>' +
          '<button type="submit" class="bc-send">Send</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(el);

    var api = {
      el: el,
      summary: el.querySelector(".bc-summary"),
      list: el.querySelector(".bc-messages"),
      contactBox: el.querySelector(".bc-contact"),
      contact: el.querySelector("#bc-contact-input"),
      error: el.querySelector(".bc-error"),
      form: el.querySelector(".bc-form"),
      input: el.querySelector(".bc-input"),
      send: el.querySelector(".bc-send"),
      client: null,
      conversationId: null,
      seen: {},
      channel: null
    };

    el.querySelector(".bc-close").addEventListener("click", closeChat);
    el.addEventListener("click", function (e) { if (e.target === el) closeChat(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && el.classList.contains("is-open")) closeChat(); });
    api.form.addEventListener("submit", function (e) { e.preventDefault(); sendMessage(); });
    api.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); }
    });
    return api;
  }

  function setError(msg) {
    chat.error.textContent = msg || "";
    chat.error.hidden = !msg;
  }

  function addMessage(m) {
    if (chat.seen[m.id]) return;
    chat.seen[m.id] = true;
    var row = document.createElement("div");
    row.className = "bc-msg bc-msg-" + (m.sender === "admin" ? "them" : "me");
    var body = document.createElement("div");
    body.className = "bc-bubble";
    body.textContent = m.body;
    var time = document.createElement("span");
    time.className = "bc-time";
    time.textContent = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    body.appendChild(time);
    row.appendChild(body);
    chat.list.appendChild(row);
    chat.list.scrollTop = chat.list.scrollHeight;
  }

  function subscribe() {
    if (chat.channel || !chat.conversationId) return;
    chat.channel = chat.client
      .channel("chat-" + chat.conversationId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + chat.conversationId },
        function (payload) { addMessage(payload.new); })
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
            m.data.forEach(addMessage);
            subscribe();
          });
      });
  }

  function openChat(info) {
    if (!chat) chat = buildChat();
    chat.summary.innerHTML = "";
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
    setError("");
    chat.el.classList.add("is-open");
    chat.el.setAttribute("aria-hidden", "false");
    document.body.classList.add("bc-noscroll");
    chat.input.focus();

    if (!chat.client) {
      chat.send.disabled = true;
      getClient().then(function (client) {
        chat.client = client;
        return loadExisting();
      }).then(function () {
        chat.send.disabled = false;
      }).catch(function () {
        setError("Private chat is unavailable right now. Please use WhatsApp or Telegram.");
        chat.client = null;
        chat.send.disabled = false;
      });
    }
  }

  function closeChat() {
    if (!chat) return;
    chat.el.classList.remove("is-open");
    chat.el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("bc-noscroll");
  }

  function sendMessage() {
    var body = chat.input.value.trim();
    if (!body) return;
    if (!chat.client) { setError("Still connecting. Please try again in a moment."); return; }
    chat.send.disabled = true;
    setError("");

    var ready = chat.conversationId
      ? Promise.resolve(chat.conversationId)
      : chat.client.from("conversations")
          .insert({ contact: chat.contact.value.trim() || null })
          .select("id").single()
          .then(function (r) {
            if (r.error) throw r.error;
            chat.conversationId = r.data.id;
            chat.contactBox.hidden = true;
            subscribe();
            return r.data.id;
          });

    ready.then(function (id) {
      return chat.client.from("messages")
        .insert({ conversation_id: id, sender: "customer", body: body })
        .select("*").single();
    }).then(function (r) {
      if (r.error) throw r.error;
      addMessage(r.data);
      chat.input.value = "";
      if (!chat.notedReply) {
        chat.notedReply = true;
        var note = document.createElement("p");
        note.className = "bc-note";
        note.textContent = "Message sent. We will reply here shortly. Keep this page open, or add your contact above next time.";
        chat.list.appendChild(note);
        chat.list.scrollTop = chat.list.scrollHeight;
      }
    }).catch(function () {
      setError("Message could not be sent. Please try again, or use WhatsApp or Telegram.");
    }).then(function () {
      chat.send.disabled = false;
    });
  }
})();
