
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
    const modalPopularityList = document.querySelector("#modal-popularity-list");
    const modalList = document.querySelector("#modal-package-list");
    const modalListHeading = document.querySelector("#modal-list-heading");
    const modalCustomizeText = document.querySelector("#modal-customize-text");
    const modalFlowIntro = document.querySelector("#modal-flow-intro");
    const modalDuration = document.querySelector("#modal-package-duration");
    const modalPrice = document.querySelector("#modal-package-price");
    const modalNormalPrice = document.querySelector("#modal-package-normal-price");
    const modalWhatsappLink = document.querySelector("#modal-whatsapp-link");
    const whatsappNumber = "60164646008";

    const buildWhatsappUrl = (packageLabel) => {
      const message = `Hi :) I would like to book the ${packageLabel} for Couple.`;
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    };

    const packageDetails = {
      premium: {
        whatsappLabel: "Premium Package",
        kicker: "PREMIUM PACKAGE",
        title: "Premium Couple Experience",
        description: "A deeper black-and-gold premium package with longer timing, advanced intimate techniques, and a richer couple flow.",
        popularity: [
          "5.0 Rated Experience",
          "Most chosen for longer sessions",
          "Ideal for couples wanting deeper intimacy"
        ],
        listHeading: "What Includes?",
        list: [
          "Relaxing Meditation",
          "Sensual Connection",
          "Full Body Massage",
          "Leg & Feet Massage",
          "Yoni Massage with Oral Pleasure",
          "Lingam & Prostate Massage",
          "Breast Massage",
          "Yoni Egg Massage",
          "Body to Body Massage",
          "Happy Ending (Optional)",
          "Head Massage (Optional)"
        ],
        customize: "Yes, but the recommendation is to go with the flow so the full premium package experience builds naturally.",
        flow: "Experience a rejuvenating full-body massage with a focus on your legs and feet. The highlight of this experience includes a luxurious yoni massage, breast massage, and a soothing yoni egg massage. Let me provide you with an incredible body-to-body massage that will enhance your relaxation and deep relaxation. Clients interested in an additional touch can opt for a happy ending. Additionally, men can enjoy a lingam massage to complete this indulgent experience.",
        duration: "1.30 - 2.00 Hours",
        normalPrice: "RM 530",
        price: "RM 480"
      },
      standard: {
        whatsappLabel: "Standard Package",
        kicker: "STANDARD PACKAGE",
        title: "Standard Couple Experience",
        description: "A smooth couple package with the core black-and-gold session flow, intimate relaxation, and a balanced duration.",
        popularity: [
          "5.0 Rated Experience",
          "Popular starter couple package",
          "Best for a shorter sensual session"
        ],
        listHeading: "What Includes?",
        list: [
          "Relaxing Meditation",
          "Sensual Connection",
          "Full Body Massage",
          "Leg & Feet Massage",
          "Yoni Massage with Oral Pleasure",
          "Breast Massage",
          "Yoni Egg Massage",
          "Body to Body Massage",
          "Head Massage (Optional)"
        ],
        customize: "Yes, but the recommendation is to go with the flow to get the best balance of touch, intimacy, and relaxation.",
        flow: "This package begins with a soothing meditation and a delightful sensual connection. Enjoy a complete full-body massage with a focus on your legs and feet. The highlight of this journey is the indulgent yoni and breast massages, along with a special yoni egg massage for added relaxation. Experience the ultimate in relaxation with an amazing body-to-body massage that will not only soothe you but also relax you further, all while your partner joins you for a truly intimate experience.",
        duration: "1.00 - 1.30 Hours",
        normalPrice: "RM 430",
        price: "RM 380"
      }
    };

    const slidePackages = (direction) => {const slidePackages = (direction) => {
      if (!packageSlider) {
        return;
      }

      const card = packageSlider.querySelector(".package-card");
      const offset = card ? card.getBoundingClientRect().width + 12 : 320;

      packageSlider.scrollBy({
        left: direction * offset,
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
      document.body.style.overflow = "";
      updatePackageModalScrollCue();
    };

    const openPackageModal = (packageKey) => {
      const details = packageDetails[packageKey];

      if (!packageModal || !details) {
        return;
      }

      modalKicker.textContent = details.kicker;
      modalTitle.textContent = details.title;
      modalDescription.textContent = details.description;
      modalPopularityList.innerHTML = details.popularity.map((item) => `<li>${item}</li>`).join("");
      modalListHeading.textContent = details.listHeading;
      modalList.innerHTML = details.list.map((item) => `<li>${item}</li>`).join("");
      modalCustomizeText.textContent = details.customize;
      modalFlowIntro.textContent = details.flow;
      modalDuration.textContent = details.duration;
      modalNormalPrice.textContent = details.normalPrice;
      modalPrice.textContent = details.price;
      modalWhatsappLink.href = buildWhatsappUrl(details.whatsappLabel || details.kicker);

      if (packageModalPanel) {
        packageModalPanel.scrollTop = 0;
      }

      packageModal.classList.add("is-open");
      packageModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
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
  