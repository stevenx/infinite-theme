(function ($, Drupal, drupalSettings, Backbone, BurdaInfinite) {

  "use strict";

  BurdaInfinite.views.MarketingView = BaseView.extend({
    adType: "",
    adEntityType: "",
    adContainerType: "",
    currentBreakpoint: "",
    adRenderModel: null,
    breakpointDeviceModel: {},
    $adSlotContainer: [],
    $adTechAd: [],
    $adEntityContainer: [],
    height: 0,
    visible: false,
    enabled: null,
    fbaIsFilled: false,
    targeting: null,
    initialize: function (pOptions) {
      BaseView.prototype.initialize.call(this, pOptions);

      this.$adSlotContainer = this.$el.find(".item-marketing");
      this.checkContainerType();
      this.breakpointDeviceModel = this.deviceModel.getDeviceBreakpoints().findWhere({active: true});
      this.currentBreakpoint = this.breakpointDeviceModel.id;
      this.listenTo(this.deviceModel.getDeviceBreakpoints(), 'change:active', this.onDeviceBreakpointHandler, this);
      this.listenTo(this.model, 'change:inviewEnabled', this.onEnabledHandler, this);
    },
    updateView: function () {
      this.removeFixHeight();

      if (this.adRenderModel.visibility == "visible") {
        this.show();
      } else {
        this.hide();
      }
    },
    checkContainerType: function () {
      this.adEntityType = this.$el.find('[data-atf-format]');

      if (this.$el.hasClass('container-sidebar-content')) {
        this.adContainerType = MarketingView.CONTAINER_TYPE_SIDEBAR;
      } else if (this.$el.hasClass('region-full-content') && this.adEntityType == MarketingView.AD_ENTITY_TYPE_LEADERBOARD) {
        this.adContainerType = MarketingView.CONTAINER_TYPE_LEADERBOARD;
      } else if (this.$el.hasClass('region-full-content') && this.adEntityType == MarketingView.AD_ENTITY_TYPE_SPECIAL) {
        this.adContainerType = MarketingView.CONTAINER_TYPE_SPECIAL;
      } else if (this.$el.hasClass('ad-content') && this.adEntityType == MarketingView.AD_ENTITY_TYPE_SPECIAL) {
        this.adContainerType = MarketingView.CONTAINER_TYPE_SPECIAL;
      }
    },
    updateEnableView: function () {
      /**
       * No atf_ad_rendered fired / only enabled
       */
      if (this.adRenderModel == null) return;


      if (this.adRenderModel.visibility == "visible" && this.enabled) {
        this.show();
      } else if (
        this.adType != MarketingView.AD_TYPE_FBSA &&
        this.adType != MarketingView.AD_TYPE_INREAD &&
        this.adContainerType != MarketingView.CONTAINER_TYPE_SIDEBAR
      ) {
        this.freeze();
      }
    },
    enableView: function () {
      if (this.enabled) return;

      this.enabled = true;
      this.updateEnableView();
    },
    disableView: function () {
      if (!this.enabled) return;

      this.enabled = false;
      this.updateEnableView();
    },
    onEnabledHandler: function (pModel) {
      if (pModel != this.model) return; //event bubbling

      if (pModel.get('inviewEnabled') == true) {
        this.enableView();
      } else {
        this.disableView();
      }
    },
    checkHeight: function () {
      if (this.height != this.$adSlotContainer.height()) {
        this.height = this.$adSlotContainer.height();
        this.model.set('contentHeight', this.height);
      }
    },
    onDeviceBreakpointHandler: function (pModel) {
      this.breakpointDeviceModel = pModel;
      this.currentBreakpoint = this.breakpointDeviceModel.id;

      if (!this.isAllowedToWrite()) return;

      this.hide();
    },
    isAllowedToWrite: function () {
      if (this.adType == MarketingView.AD_TYPE_FBSA || this.adType == MarketingView.AD_TYPE_INREAD) {
        return false;
      }

      return this.enabled;
    },
    isActive: function () {
      if (this.adContainerType == MarketingView.CONTAINER_TYPE_SIDEBAR && this.currentBreakpoint != "desktop") {
        return false;
      }

      return this.enabled;
    },
    show: function () {
      this.$el.removeClass('ad-inactive').addClass('ad-active');
      this.checkHeight();
      this.visible = true;
    },
    hide: function () {
      this.$el.removeClass('ad-active ad-fba').addClass('ad-inactive');
      this.adType = "";
      this.clear();
      this.removeFixHeight();
      this.visible = false;
    },
    freeze: function () {
      this.setFixHeight(this.getAdEntityContainer().height());
      this.clear();
    },
    clear: function () {
      if (this.adType == MarketingView.AD_TYPE_FBSA && this.fbaIsFilled) {
        window.ftNuke();
        this.fbaIsFilled = false;
      } else if (this.getAdTechAd().length > 0) {
        this.getAdTechAd().empty();
      }
    },
    setFixHeight: function (pHeight) {
      this.getAdEntityContainer().css('height', pHeight);
    },
    removeFixHeight: function () {
      if (this.getAdEntityContainer().prop("style") && this.getAdEntityContainer().prop("style")["height"] !== '') {
        this.getAdEntityContainer().css('height', 'auto');
      }
    },
    getAdEntityContainer: function () {
      if (this.$adEntityContainer.length <= 0) {
        this.$adEntityContainer = this.$el.find('.ad-entity-container');
      }

      return this.$adEntityContainer;
    },
    getAdTechAd: function () {
      if (this.$adTechAd.length <= 0) {
        this.$adTechAd = this.$el.find('.adtech-factory-ad');
      }

      return this.$adTechAd;
    },
    getTargeting: function () {
      var tmpTargeting = this.getAdTechAd().attr('data-ad-entity-targeting') || {};
      return JSON.parse(tmpTargeting);
    },
    getAdContainerType: function () {
      return this.adContainerType;
    },
    setRenderedAdType: function (pAdType, pElement) {
      this.adType = pAdType;

      if (pAdType == MarketingView.AD_TYPE_FBSA) {
        this.$el.addClass('ad-' + MarketingView.AD_TYPE_FBSA);
        this.fbaIsFilled = true;

        if (pElement != undefined) {
          pElement.contentWindow.addEventListener("DOMContentLoaded", _.bind(function (pTest) {
            this.checkHeight();
          }, this));
        }
      }

      console.log("setRenderedAdType", this.adType);
    },
    setRenderModel: function (pAdModel) {
      this.adRenderModel = pAdModel;
      this.updateView();
    }
  }, {
    CONTAINER_TYPE_SIDEBAR: "CONTAINER_TYPE_SIDEBAR",
    CONTAINER_TYPE_SPECIAL: "CONTAINER_TYPE_SPECIAL",
    CONTAINER_TYPE_LEADERBOARD: "CONTAINER_TYPE_LEADERBOARD",
    AD_ENTITY_TYPE_LEADERBOARD: "AD_ENTITY_TYPE_LEADERBOARD",
    AD_ENTITY_TYPE_SPECIAL: "AD_ENTITY_TYPE_SPECIAL",
    AD_TYPE_FBSA: "fba",
    AD_TYPE_INREAD: "inread"
  });

  window.MarketingView = window.MarketingView || BurdaInfinite.views.MarketingView;

})(jQuery, Drupal, drupalSettings, Backbone, BurdaInfinite);
