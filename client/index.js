$(document).ready(function () {
  // Set Document Title
  $("title").text(app.config.title);
  // Set Document Language
  $("html").attr("lang", app.label.language.iso.code);

  if (!api.uri.getNoHeader())
    //  Get Header
    api.content.load("#header", "template/header.html");

  if (!api.uri.getNoNavbar())
    // Get Navigation
    api.content.load("#navigation", "template/navigation.html");

  if (!api.uri.getNoFooter())
    // Get Footer
    api.content.load("#footer", "template/footer.html");

  // Get Cookie Consent
  api.content.load("#cookie", "template/cookie.html");

  // Get Alerts
  api.content.load("#alert", "entity/manage/alert/index.notice.html");

  // Get Modal
  api.content.load("#modal", "template/modal.html");

  // Get Modal Openaccess
  api.content.load("#modal-openaccess", "template/modal.openaccess.html");

  // Get Spinner
  api.content.load("#spinner", "template/spinner.html");

  // Responsivness
  $("#panel-toggle").once("click", function (e) {
    $("#panel").slideToggle("slow", function () {
      if ($("#panel").is(":visible")) {
        $("#panel-toggle").find("i").removeClass().addClass("fas fa-minus-circle");
      }
      else {
        $("#panel-toggle").find("i").removeClass().addClass("fas fa-plus-circle");
      }
      $('html, body').animate({ scrollTop: $('#panel-toggle').offset().top }, 1000);
    });
  });

  // Responsivness
  $("#data-filter-toggle").once("click", function (e) {
    $("#data-filter").slideToggle("slow", function () {
      if ($("#data-filter").is(":visible")) {
        $("#data-filter-toggle").find("i").removeClass().addClass("fas fa-minus-circle");
      }
      else {
        $("#data-filter-toggle").find("i").removeClass().addClass("fas fa-plus-circle");
      }
      $('html, body').animate({ scrollTop: $('#data-filter-toggle').offset().top }, 1000);
    });
  });

  // Check and stop if IE browser detected
  if (app.library.utility.isIE()) {
    return;
  }

  // Get Custom Body
  if (api.uri.getBody()) {
    api.content.goTo(api.uri.getBody());
  }
  // Load a CookieLink or the Default page
  else if (Cookies.get(C_COOKIE_LINK_SEARCH)) {
    app.library.utility.cookieLink(C_COOKIE_LINK_SEARCH, "Search", "entity/data/", "#nav-link-data");
  } else if (Cookies.get(C_COOKIE_LINK_PRODUCT)) {
    app.library.utility.cookieLink(C_COOKIE_LINK_PRODUCT, "PrcCode", "entity/data/", "#nav-link-data");
  } else if (Cookies.get(C_COOKIE_LINK_COPYRIGHT)) {
    app.library.utility.cookieLink(C_COOKIE_LINK_COPYRIGHT, "CprCode", "entity/data/", "#nav-link-data");
  } else if (Cookies.get(C_COOKIE_LINK_TABLE)) {
    app.library.utility.cookieLink(C_COOKIE_LINK_TABLE, "MtrCode", "entity/data/", "#nav-link-data");
  } else if (Cookies.get(C_COOKIE_LINK_RELEASE)) {
    app.library.utility.cookieLink(C_COOKIE_LINK_RELEASE, "RlsCode", "entity/release/", "#nav-link-release");
  } else {
    // Load default Entity
    api.content.goTo("entity/data/", "#nav-link-data");
  }
  if (api.uri.isParam("method")) {
    switch (api.uri.getParam("method")) {
      case "PxStat.Security.Login_API.Create1FA":
      case "PxStat.Security.Login_API.Update1FA":
        //first call check API before setting password
        app.openAccess.ajax.readOpen1FA();
        break;
      case "PxStat.Security.Login_API.Create2FA":
      case "PxStat.Security.Login_API.Update2FA":
        app.openAccess.ajax.readOpen2FA();
        break;
      default:
        //redirect to home page
        window.location.href = window.location.pathname;
        break;
    }

  };
});
