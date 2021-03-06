(function ($, Drupal, drupalSettings, Backbone, BurdaInfinite) {

  "use strict";

  BurdaInfinite.models.base.BaseModel = Backbone.Model.extend({
    defaults: {
      inviewEnabled: true,
      initialDOMItem: true,
      type: "root"
    },
    initialize: function (pModel, pOptions) {
      _.extend(this, pOptions);
    },
    create: function (pData) {
      this.set(pData);
    },
    inviewEnable: function (pState) {
      this.set('inviewEnabled', pState);
    },
    hasItems: function () {
      return false;
    },
    refresh: function () {
      this.trigger('refresh', this);
    },
    setParentModel: function (pModel) {
      this.set('parentModel', pModel, {silent: true});
    },
    getParentModel: function () {
      return this.get('parentModel');
    }
  });

  window.BaseModel = window.BaseModel || BurdaInfinite.models.base.BaseModel;

})(jQuery, Drupal, drupalSettings, Backbone, BurdaInfinite);
