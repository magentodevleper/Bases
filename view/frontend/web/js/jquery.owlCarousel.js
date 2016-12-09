define([
  'jquery',
  'Vsourz_Base/js/owlCarousel-1'
], function($){
 'user strict'
  return function (config, element) {
   $(element).owlCarousel(config);
  }
});