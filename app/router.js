define([
  // Application.
  "app",
    "modules/Game"
],

function(app, Game) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function() {

        app.useLayout('field-layout').setViews({
            '.table-holder' : new Game.Views.Table()
        }).render();

    }
  });

  return Router;

});
