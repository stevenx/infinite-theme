(function ($, Drupal, drupalSettings, Backbone, BurdaInfinite) {

  "use strict";

  BurdaInfinite.views.InfiniteBlockView = BaseDynamicView.extend({
    initialize: function (pOptions) {
      BaseDynamicView.prototype.initialize.call(this, pOptions);
    }
  });

  window.InfiniteBlockView = window.InfiniteBlockView || BurdaInfinite.views.InfiniteBlockView;

})(jQuery, Drupal, drupalSettings, Backbone, BurdaInfinite);
