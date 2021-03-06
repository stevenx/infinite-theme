(function ($, Drupal, drupalSettings, Backbone, BurdaInfinite) {

  "use strict";

  BurdaInfinite.views.ProductView = BaseInviewView.extend({
    advancedTrackingData: null,
    $containerElement: [],
    posTop: 0,
    initialize: function (pOptions) {
      BaseInviewView.prototype.initialize.call(this, pOptions);

      this.delegateInview();
      this.addListener();
      this.createModel();

      /**
       * infiniteBlockDataModel set in base-dynamic-view
       */
      // console.log(">>> this.infiniteBlockDataModel", this.infiniteBlockDataModel);

      if (this.infiniteBlockDataModel) {

        if (this.infiniteBlockDataModel.has('trackingContainerType') && this.model.get('componentType') != ProductView.COMPONENT_TYPE_SLIDER) {
          this.model.set('containerType', this.infiniteBlockDataModel.get('trackingContainerType').toLowerCase());
        }

        if (this.infiniteBlockDataModel.has('uuid')) {
          this.advancedTrackingData = TrackingManager.getAdvTrackingByUuid(this.infiniteBlockDataModel.has('uuid'));
          this.extendDataLayerInfo();
        }

        if (this.infiniteBlockDataModel.getElement().length > 0) {
          this.$containerElement = this.infiniteBlockDataModel.getElement();
          this.setProductIndex(); //set on this position to override the function
        }

      }

      if (this.model.get('componentType') == ProductView.COMPONENT_TYPE_SLIDER) {
        this.model.set('containerType', ProductView.COMPONENT_TYPE_SLIDER);
      }

      this.posTop = Math.floor(this.$el.offset().top);

      this.initCustomTracking();
      this.collectTrackingData();
      this.checkPos();
    },
    delegateInview: function () {
      /**
       * activate inview functions
       */
      BaseInviewView.prototype.delegateInview.call(this);
    },
    checkPos: function () {
      var tmpPos = Math.floor(this.$el.offset().top);
      if (tmpPos != this.posTop) {
        this.refresh();
        this.posTop = tmpPos;
      }
    },
    addListener: function () {
      this.$el.unbind('click.enhanced_ecommerce').bind('click.enhanced_ecommerce', $.proxy(this.onProductClickHandler, this));
      $(window).scroll(_.bind(this.checkPos, this));
    },
    createModel: function () {
      var tmpComponentType = '';

      this.model.set('provider', this.$el.data('provider'));
      this.model.set('price', this.$el.data('price') + '');
      this.model.set('currency', this.$el.data('currency'));
      this.model.set('category', this.$el.data('category'));
      this.model.set('title', this.$el.data('title'));
      this.model.set('shop', this.$el.data('shop'));
      this.model.set('productId', this.$el.data('product-id') + '');
      this.model.set('brand', this.$el.data('brand'));
      this.model.set('viewType', this.$el.data('view-type'));
      this.model.set('productCategory', this.$el.data('product-category'));
      this.model.set('url', this.$el.data('external-url') || this.$el.data('internal-url'));

      if (this.$el.hasClass('item-product--single')) {
        tmpComponentType = ProductView.COMPONENT_TYPE_SINGLE;
      } else if (this.$el.hasClass('item-product-slider')) {
        tmpComponentType = ProductView.COMPONENT_TYPE_SLIDER;
      } else {
        tmpComponentType = ProductView.COMPONENT_TYPE_GRID;
      }

      this.model.set('componentType', tmpComponentType);

      //fallback - provider is empty for generic products
      if (this.model.get('provider') == '') {
        this.model.set('provider', ProductView.PROVIDER_GENERIC);
      }

      //generic products has no id
      if (this.model.get('productId') == 'undefined') {
        this.model.set('productId', ProductView.PROVIDER_GENERIC);
      }
    },
    extendDataLayerInfo: function () {
      if (this.advancedTrackingData.hasOwnProperty('page')) {
        this.model.set('entityType', this.advancedTrackingData.page.entityType);
        this.model.set('contentType', this.advancedTrackingData.page.contentType);
        this.model.set('entityID', this.advancedTrackingData.page.entityID);
        this.model.set('entityName', this.advancedTrackingData.page.name);
      }
    },
    initCustomTracking: function () {
      /**
       * ask Steffen Schulz for this shizzl
       */
      var tmpExternalTrackingURL = this.model.get('url'),
        tmpSlicedString = "",
        tmpComponent;

      if(tmpExternalTrackingURL == '' || tmpExternalTrackingURL == undefined) return;

      if (this.model.has('containerType') && this.model.get('containerType') != '') {
        tmpComponent = '-' + this.model.get('containerType').toLowerCase();
      }

      switch (this.model.get('provider')) {
        case ProductView.PROVIDER_TRACDELIGHT:

          if (tmpExternalTrackingURL.indexOf("subid=") > -1) {
            tmpExternalTrackingURL = BaseUtils.replaceUrlParam(tmpExternalTrackingURL, 'subid', window.getURLParam('subid', tmpExternalTrackingURL) + tmpComponent);
          }

          break;
        case ProductView.PROVIDER_AMAZON:

          //TODO change this to dynamic value for all platforms
          if (tmpExternalTrackingURL.indexOf(AppConfig.amazonURLTrId) > -1) {

            tmpSlicedString = AppConfig.amazonURLTrId.split('-');
            if (tmpSlicedString.length > 1) {
              tmpSlicedString = tmpSlicedString[0] + tmpComponent + '-' + tmpSlicedString[1];
            } else {
              tmpSlicedString = AppConfig.amazonURLTrId + tmpComponent;
            }

            tmpExternalTrackingURL = tmpExternalTrackingURL.replace(AppConfig.amazonURLTrId, tmpSlicedString);
          }

          break;
        case ProductView.PROVIDER_GENERIC:

          if (tmpExternalTrackingURL.indexOf("//td.") > -1 && tmpExternalTrackingURL.indexOf("&link") > -1) {
            tmpSlicedString = tmpExternalTrackingURL.substring(tmpExternalTrackingURL.indexOf('&link'), tmpExternalTrackingURL.length);

            if (this.model.has('entityType')) {

              var tmpSlicedTitle = this.model.get('title').replace(/[\/. ,:-]+/g, "_").toLowerCase().slice(0, Math.min(10, this.model.get('title').length));
              tmpSlicedString = "&subid="
                + this.model.get('entityType')
                + '-' + this.model.get('entityID')
                + '-' + tmpSlicedTitle
                + tmpComponent;
            }

            tmpExternalTrackingURL = tmpExternalTrackingURL.replace(tmpExternalTrackingURL.substring(tmpExternalTrackingURL.indexOf("&link"), tmpExternalTrackingURL.length), tmpSlicedString);
          }

          break;

      }

      if (tmpExternalTrackingURL != this.model.get('url')) {
        this.model.set('tracking-url', tmpExternalTrackingURL);
        this.$el.attr("data-external-url", tmpExternalTrackingURL);
      }
    },
    collectTrackingData: function () {
      var tmpEnhancedEcommerceData = {
        list: this.model.get('componentType'),
        category: this.model.get('shop'),
        name: this.model.get('title'),
        id: this.model.get('productId'),
        price: this.model.get('price'),
        brand: this.model.get('brand'),
        provider: this.model.get('provider'),
        productCategory: this.model.get('productCategory'),
        containerType: this.model.get('containerType') || ''
      };

      if (this.model.has('productIndex')) {
        tmpEnhancedEcommerceData.index = this.model.get('productIndex');
      }

      this.model.set('enhancedEcommerce', tmpEnhancedEcommerceData);
    },
    setProductIndex: function () {
      if (this.$containerElement.length > 0) {
        var tmpProductIndex = this.$containerElement.find('.item-ecommerce').not('.item-product-slider').index(this.$el);
        this.model.set('productIndex', tmpProductIndex);
      }
    },
    trackImpression: function () {
      this.model.set('trackImpression', true);
      TrackingManager.trackEcommerce(this.model.get('enhancedEcommerce'), 'impressions', this.advancedTrackingData);
    },
    trackProductClick: function () {
      TrackingManager.trackEcommerce(this.model.get('enhancedEcommerce'), 'productClick', this.advancedTrackingData);
    },
    refresh: function () {
      var tmpWaypoints;

      if (this.inview && typeof this.inview.waypoints != 'undefined') {
        tmpWaypoints = this.inview.waypoints || [];
        $.each(tmpWaypoints, function (pIndex, pWaypoint) {
          pWaypoint.context.refresh();
        });
      }
    },
    onProductClickHandler: function (pEvent) {
      this.trackProductClick();
    },
    onEnterHandler: function (pDirection) {
      BaseInviewView.prototype.onEnterHandler.call(this, pDirection);
      this.trackImpression();
      this.destroy();
    }
  }, {
    PROVIDER_TRACDELIGHT: 'tracdelight',
    PROVIDER_AMAZON: 'amazon',
    PROVIDER_GENERIC: 'generic',
    COMPONENT_TYPE_SLIDER: 'slider',
    COMPONENT_TYPE_GRID: 'grid',
    COMPONENT_TYPE_SINGLE: 'single'
  });

  window.ProductView = window.ProductView || BurdaInfinite.views.ProductView;

})(jQuery, Drupal, drupalSettings, Backbone, BurdaInfinite);