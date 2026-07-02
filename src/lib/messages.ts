// All user-facing copy for the public marketing site + checkout, in English +
// French. The site has a language toggle (see src/lib/i18n.tsx + Nav.tsx). Keep
// both locales in sync — the Messages type enforces that every key exists in both.

import type { PackageKey } from "./products";

export type Locale = "en" | "fr";

export type Messages = {
  nav: { pricing: string; contact: string };
  hero: { titleLine1: string; titleHighlight: string; subtitle: string };
  services: {
    siteName: string;
    siteBlurb: string;
    crmName: string;
    crmBlurb: string;
    bundleName: string;
    bundleBlurb: string;
    cta: string;
  };
  demos: {
    heading: string;
    viewLive: string;
    electrician: string;
    construction: string;
    dental: string;
  };
  contact: {
    heading: string;
    callNow: string;
    whatsapp: string;
    email: string;
    preferCallback: string;
    name: string;
    phone: string;
    send: string;
    sending: string;
    thanks: string;
    error: string;
  };
  footer: { rights: string; privacy: string; terms: string; contact: string };
  // Per-package name / tagline / feature list used on the checkout summary.
  packages: Record<PackageKey, { name: string; tagline: string; features: string[] }>;
  checkout: {
    secureCheckout: string;
    title: string;
    yourDetails: string;
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    currentWebsite: string;
    notesLabel: string;
    notesPlaceholder: string;
    agreePrefix: string;
    termsLink: string;
    agreeSuffix: string;
    orderSummary: string;
    total: string;
    fillAndAgree: string;
    processing: string;
    paypalNotConfigured: string;
    secureNote1: string;
    secureNote2: string;
  };
  success: {
    heading: string;
    bodyWithPkg: string; // contains {pkg} placeholder
    bodyNoPkg: string;
    body2: string;
    backHome: string;
  };
};

export const messages: Record<Locale, Messages> = {
  en: {
    nav: { pricing: "Pricing", contact: "Contact" },
    hero: {
      titleLine1: "Streamline",
      titleHighlight: "your business.",
      subtitle: "Custom-built operations management systems & databases.",
    },
    services: {
      siteName: "Website",
      siteBlurb: "A fast, custom website — designed, built and live in days.",
      crmName: "Custom OMS (Operations Management System)",
      crmBlurb: "A complete business HQ to manage your leads, clients and admin tools.",
      bundleName: "Website + Custom OMS",
      bundleBlurb: "The full stack — site and system, built together as one.",
      cta: "Add to cart →",
    },
    demos: {
      heading: "Demo systems",
      viewLive: "View live →",
      electrician: "Electrician",
      construction: "Construction",
      dental: "Dental",
    },
    contact: {
      heading: "Get in touch.",
      callNow: "Call now",
      whatsapp: "WhatsApp",
      email: "Email",
      preferCallback: "Prefer a call back?",
      name: "Name",
      phone: "Phone number",
      send: "Send & we'll call you →",
      sending: "Sending…",
      thanks: "Thanks — we'll call you back.",
      error: "Please add your name and phone — or try again.",
    },
    footer: { rights: "All rights reserved.", privacy: "Privacy", terms: "Terms", contact: "Contact" },
    packages: {
      site: {
        name: "Website",
        tagline: "A fast, professional site — built to order, live in days.",
        features: [
          "Custom multi-page website design",
          "Mobile-first, lightning fast",
          "Contact form + business email setup",
          "Basic SEO + Google indexing",
          "Next day delivery",
        ],
      },
      crm: {
        name: "Custom OMS (Operations Management System)",
        tagline: "Your own lead + customer system, tailored to how you work.",
        features: [
          "Tailored customer & lead database",
          "Pipeline, notes, follow-up tracking",
          "Built-in dialler + email tools",
          "Secure login for your team",
          "Hosting, support & updates included",
        ],
      },
      bundle: {
        name: "Website + Custom OMS",
        tagline: "The full stack — your site and system, built together.",
        features: [
          "Everything in Website",
          "Everything in Custom OMS",
          "Site and system wired together",
          "Leads flow straight from site to system",
          "Save £250 every year vs separately",
        ],
      },
    },
    checkout: {
      secureCheckout: "Secure checkout",
      title: "Checkout",
      yourDetails: "Your details",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      businessName: "Business name",
      currentWebsite: "Current website (optional)",
      notesLabel: "Anything we should know? (optional)",
      notesPlaceholder: "Pages you need, style you like, deadline, examples you love…",
      agreePrefix: "I've read and agree to the ",
      termsLink: "Terms & Conditions",
      agreeSuffix: ".",
      orderSummary: "Order summary",
      total: "Total",
      fillAndAgree: "Fill in your details & agree to the terms",
      processing: "Processing payment…",
      paypalNotConfigured: "PayPal isn't configured yet.",
      secureNote1: "🔒 Secure checkout, protected by PayPal.",
      secureNote2: "Card payments accepted — no PayPal account needed.",
    },
    success: {
      heading: "Payment received",
      bodyWithPkg: "Thank you for ordering the {pkg}. Your payment has gone through and we've got everything we need to get started.",
      bodyNoPkg: "Thank you. Your payment has gone through and we've got everything we need to get started.",
      body2: "We'll be in touch within one working day to kick off your build. Keep an eye on your inbox (and check spam just in case).",
      backHome: "Back to home",
    },
  },
  fr: {
    nav: { pricing: "Tarifs", contact: "Contact" },
    hero: {
      titleLine1: "Simplifiez",
      titleHighlight: "votre activité.",
      subtitle: "Systèmes de gestion des opérations et bases de données sur mesure.",
    },
    services: {
      siteName: "Site web",
      siteBlurb: "Un site rapide et sur mesure — conçu, développé et en ligne en quelques jours.",
      crmName: "OMS sur mesure (système de gestion des opérations)",
      crmBlurb: "Un QG complet pour gérer vos leads, vos clients et vos outils d'administration.",
      bundleName: "Site web + OMS sur mesure",
      bundleBlurb: "La solution complète — site et système, construits ensemble comme un seul système.",
      cta: "Ajouter au panier →",
    },
    demos: {
      heading: "Systèmes de démonstration",
      viewLive: "Voir la démo →",
      electrician: "Électricien",
      construction: "Construction",
      dental: "Dentaire",
    },
    contact: {
      heading: "Contactez-nous.",
      callNow: "Appeler",
      whatsapp: "WhatsApp",
      email: "E-mail",
      preferCallback: "Vous préférez être rappelé ?",
      name: "Nom",
      phone: "Numéro de téléphone",
      send: "Envoyer & on vous rappelle →",
      sending: "Envoi…",
      thanks: "Merci — nous vous rappellerons.",
      error: "Ajoutez votre nom et votre téléphone — ou réessayez.",
    },
    footer: { rights: "Tous droits réservés.", privacy: "Confidentialité", terms: "Conditions", contact: "Contact" },
    packages: {
      site: {
        name: "Site web",
        tagline: "Un site rapide et professionnel — construit sur mesure, en ligne en quelques jours.",
        features: [
          "Site web multi-pages sur mesure",
          "Optimisé mobile, ultra rapide",
          "Formulaire de contact + e-mail professionnel",
          "SEO de base + indexation Google",
          "Livraison le lendemain",
        ],
      },
      crm: {
        name: "OMS sur mesure (système de gestion des opérations)",
        tagline: "Votre propre système de leads et clients, adapté à votre façon de travailler.",
        features: [
          "Base de données clients et leads sur mesure",
          "Pipeline, notes et suivi des relances",
          "Numéroteur et outils e-mail intégrés",
          "Connexion sécurisée pour votre équipe",
          "Hébergement, support et mises à jour inclus",
        ],
      },
      bundle: {
        name: "Site web + OMS sur mesure",
        tagline: "La solution complète — votre site et système, construits ensemble.",
        features: [
          "Tout ce qui est inclus dans le Site web",
          "Tout ce qui est inclus dans l’OMS sur mesure",
          "Site et système connectés ensemble",
          "Les leads passent directement du site au système",
          "Économisez 250 £ chaque année",
        ],
      },
    },
    checkout: {
      secureCheckout: "Paiement sécurisé",
      title: "Commande",
      yourDetails: "Vos coordonnées",
      fullName: "Nom complet",
      email: "E-mail",
      phone: "Téléphone",
      businessName: "Nom de l'entreprise",
      currentWebsite: "Site web actuel (facultatif)",
      notesLabel: "Quelque chose à nous signaler ? (facultatif)",
      notesPlaceholder: "Pages souhaitées, style aimé, délai, exemples que vous adorez…",
      agreePrefix: "J'ai lu et j'accepte les ",
      termsLink: "Conditions générales",
      agreeSuffix: ".",
      orderSummary: "Récapitulatif de la commande",
      total: "Total",
      fillAndAgree: "Remplissez vos coordonnées et acceptez les conditions",
      processing: "Traitement du paiement…",
      paypalNotConfigured: "PayPal n'est pas encore configuré.",
      secureNote1: "🔒 Paiement sécurisé, protégé par PayPal.",
      secureNote2: "Paiement par carte accepté — aucun compte PayPal requis.",
    },
    success: {
      heading: "Paiement reçu",
      bodyWithPkg: "Merci pour votre commande — {pkg}. Votre paiement est passé et nous avons tout ce qu'il faut pour démarrer.",
      bodyNoPkg: "Merci. Votre paiement est passé et nous avons tout ce qu'il faut pour démarrer.",
      body2: "Nous vous contacterons sous un jour ouvré pour lancer votre projet. Surveillez votre boîte mail (et les spams au cas où).",
      backHome: "Retour à l'accueil",
    },
  },
};
