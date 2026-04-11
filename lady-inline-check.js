
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-9PCZZ8BQPS');


    const packageSlider = document.querySelector("#package-slider");
    const nextPackageButton = document.querySelector("#next-package");
    const prevPackageButton = document.querySelector("#prev-package");
    const packageModal = document.querySelector("#package-modal");
    const packageModalPanel = document.querySelector(".package-modal__panel");
    const packageModalScrollCue = document.querySelector("#package-modal-scroll-cue");
    const packageModalClose = document.querySelector("#package-modal-close");
    const packageButtons = document.querySelectorAll("[data-package-open]");
    const modalKicker = document.querySelector("#modal-package-kicker");
    const modalTitle = document.querySelector("#modal-package-title");
    const modalDescription = document.querySelector("#modal-package-description");
    const modalList = document.querySelector("#modal-package-list");
    const modalListHeading = document.querySelector("#modal-list-heading");
    const modalPopularityBlock = document.querySelector("#modal-popularity-block");
    const modalPopularityList = document.querySelector("#modal-popularity-list");
    const modalCustomizeBlock = document.querySelector("#modal-customize-block");
    const modalCustomizeText = document.querySelector("#modal-customize-text");
    const modalFlowBlock = document.querySelector("#modal-flow-block");
    const modalFlowIntro = document.querySelector("#modal-flow-intro");
    const modalFlowLines = document.querySelector("#modal-flow-lines");
    const modalDuration = document.querySelector("#modal-package-duration");
    const modalPrice = document.querySelector("#modal-package-price");
    const modalNormalPrice = document.querySelector("#modal-package-normal-price");
    const modalLocationRow = document.querySelector("#modal-location-row");
    const modalNormalPriceRow = document.querySelector("#modal-normal-price-row");
    const modalLimitedNote = document.querySelector("#modal-limited-note");
    const modalWhatsappLink = document.querySelector("#modal-whatsapp-link");

    const whatsappNumber = "60164649008";
    const buildWhatsappUrl = (packageLabel) => {
      const message = `Hi I would like to book the ${packageLabel} for Lady. 🙂`;
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    };

    const packageDetails = {
      unlimited: {
        whatsappLabel: "Unlimited Package",
        kicker: "UNLIMITED PACKAGE",
        title: "",
        description: "",
        listHeading: "What Includes?",
        duration: "1.5 - 2 Hours",
        normalPrice: "RM 430.00",
        price: "RM 380.00",
        popularity: [
          "5 Star Rating",
          "100% Private & Discreet"
        ],
        items: [
          "Relaxing Meditation",
          "Tantric & Yoni Massage Experience",
          "Deep Stress Relief & Total Relaxation",
          "Full Body Massage & Energy Flow",
          "Yoni Egg & G-Spot Pleasure",
          "Body-to-Body Massage",
          "Complete Physical & Emotional Release",
          "Deep Oral Pleasures",
          "Hands, Legs & Feet Massage"
        ],
        customize: "Yes. Your session can be tailored based on your comfort level and preference ??? whether you want a more relaxing, more connected, or a deeper experience.",
        flowIntro: "I will guide you through the entire experience.",
        flowLines: [
          "The session begins with calming meditation and gentle connection to help you fully relax...",
          "Then flows into a full body massage, including hands, legs, and feet to release tension...",
          "Gradually moving into more intimate and engaging techniques, based on your comfort and preference...",
          "Ending with a deeply relaxing and satisfying experience."
        ],
        hideLocation: true,
        bookingLabel: "Book My Private Session"
      },
      extreme: {
        whatsappLabel: "Extreme Experience Package",
        kicker: "EXTREME EXPERIENCE",
        title: "Short. Intense",
        description: "",
        listHeading: "What Includes?",
        duration: "0.45 Hours",
        normalPrice: "RM 330.00",
        price: "RM 290.00",
        popularity: [
          "4.0 Rated Experience",
          "100% Private & Discreet"
        ],
        items: [
          "Relaxing Meditation",
          "Full Body Massage (Focused Session)",
          "Shoulder & Upper Body Release",
          "Hands, Legs & Feet Massage",
          "Deep Relaxation & Stress Relief"
        ],
        customize: "Yes. Your session can be tailored based on your comfort level and preference ??? whether you prefer a more relaxing or slightly more engaging experience.",
        flowIntro: "I will guide you through the entire experience.",
        flowLines: [
          "The session begins with a calming moment and medidation to help you relax and settle in...",
          "Then flows into a focused full body massage, including shoulders, hands, legs, and feet...",
          "Designed to quickly release tension, refresh your body, and leave you feeling relaxed and recharged."
        ],
        bookingLabel: "[ Book My Private Session Now ]"
      },
      custom: {
        whatsappLabel: "Customize Package",
        kicker: "Customize Package",
        title: "Build Your Own Session",
        description: "Choose only the individual services you want and message us on WhatsApp to create a private session that fits your budget.",
        listHeading: "What Includes?",
        duration: "Flexible Duration",
        normalPrice: "Custom Based",
        price: "From RM 80",
        items: [
          "Yoni Massage - RM 100",
          "Yoni Massage with Oral Pleasure - RM 150",
          "Breast Massage - RM 80",
          "Full Body with Leg & Feet - RM 150",
          "Full Body without Leg and Feet - RM 100"
        ]
      },

      day: {
        whatsappLabel: "Day Package",
        kicker: "Day Package",
        title: "Luxury Extended Session",
        description: "A longer premium private session for slow build-up, deeper connection, and a more luxurious sensual experience.",
        listHeading: "What Includes?",
        duration: "2 - 3 Hours",
        normalPrice: "RM 680.00",
        price: "RM 600.00",
        items: [
          "Extended tantric pleasure session",
          "Yoni egg massage and stimulation",
          "Long full body relaxation flow",
          "Private sensual indulgence without rush",
          "Luxury out call premium session"
        ]
      }
    };

    const slidePackages = (direction) => {const slidePackages = (direction) => {
      if (!packageSlider) {
        return;
      }

      const card = packageSlider.querySelector(".package-card");
      const gap = 16;
      const moveAmount = card ? card.getBoundingClientRect().width + gap : 280;

      packageSlider.scrollBy({
        left: direction * moveAmount,
        behavior: "smooth"
      });
    };

    const updatePackageModalScrollCue = () => {
      if (!packageModalPanel || !packageModalScrollCue || !packageModal.classList.contains("is-open")) {
        packageModalScrollCue?.classList.remove("is-visible");
        return;
      }

      const hasOverflow = packageModalPanel.scrollHeight - packageModalPanel.clientHeight > 24;
      const nearTop = packageModalPanel.scrollTop < 24;
      packageModalScrollCue.classList.toggle("is-visible", hasOverflow && nearTop);
    };

    const closePackageModal = () => {
      if (!packageModal) {
        return;
      }

      packageModal.classList.remove("is-open");
      packageModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("overflow-hidden");
      updatePackageModalScrollCue();
    };

    const openPackageModal = (packageKey) => {
      const details = packageDetails[packageKey];

      if (!packageModal || !details) {
        return;
      }

      modalKicker.innerHTML = details.kicker;
      const isUnlimited = details.kicker === "UNLIMITED PACKAGE";
      modalKicker.className = isUnlimited
        ? "text-[1.18rem] font-extrabold uppercase leading-5 text-[var(--gold)]"
        : "text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]";
      modalTitle.textContent = details.title || details.kicker;
      modalTitle.classList.toggle("hidden", !details.title);
      modalDescription.textContent = details.description || "";
      modalDescription.classList.toggle("hidden", !details.description);
      modalListHeading.textContent = details.listHeading || "What Includes?";
      modalDuration.textContent = details.duration;
      modalPrice.textContent = details.price;
      modalNormalPrice.textContent = details.normalPrice || "";
      modalLocationRow.classList.toggle("hidden", !!details.hideLocation);
      modalNormalPriceRow.classList.toggle("hidden", !details.normalPrice);
      modalList.innerHTML = details.items.map((item) => `<li class="flex gap-3"><span class="text-[var(--gold)]">&rarr;</span><span>${item}</span></li>`).join("");
      modalPopularityBlock.classList.toggle("hidden", !details.popularity);
      modalPopularityList.innerHTML = details.popularity ? details.popularity.map((item, index) => `<li class="flex items-center gap-2">${index === 0 ? `<span class="rating-stars">&#9733;</span>` : `<span class="text-[var(--gold)]">&#128274;</span>`}<span>${item}</span></li>`).join("") : "";
      modalCustomizeBlock.classList.toggle("hidden", !details.customize);
      modalCustomizeText.textContent = details.customize || "";
      modalFlowBlock.classList.toggle("hidden", !details.flowLines);
      modalFlowIntro.textContent = details.flowIntro || "";
      modalFlowLines.innerHTML = details.flowLines ? details.flowLines.map((item) => `<p>${item}</p>`).join("") : "";
      modalLimitedNote.classList.toggle("hidden", !details.limitedNote);
      modalLimitedNote.textContent = details.limitedNote || "";
      modalWhatsappLink.textContent = details.bookingLabel || "Book via WhatsApp";
      modalWhatsappLink.href = buildWhatsappUrl(details.whatsappLabel || details.kicker);
      if (packageModalPanel) {
        packageModalPanel.scrollTop = 0;
      }
      packageModal.classList.add("is-open");
      packageModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("overflow-hidden");
      requestAnimationFrame(updatePackageModalScrollCue);
    };

    if (nextPackageButton) {
      nextPackageButton.addEventListener("click", () => slidePackages(1));
    }

    if (prevPackageButton) {
      prevPackageButton.addEventListener("click", () => slidePackages(-1));
    }

    packageButtons.forEach((button) => {
      button.addEventListener("click", () => openPackageModal(button.dataset.packageOpen));
    });

    if (packageModalClose) {
      packageModalClose.addEventListener("click", closePackageModal);
    }

    if (packageModalPanel) {
      packageModalPanel.addEventListener("scroll", updatePackageModalScrollCue);
    }

    if (packageModal) {
      packageModal.addEventListener("click", (event) => {
        if (event.target === packageModal) {
          closePackageModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePackageModal();
      }
    });

