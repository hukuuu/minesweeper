define([
    "backbone.layoutmanager",
    "handlebars"
], function (asdf,Handlebars) {

    // Provide a global location to place configuration settings and module
    // creation.
    var app = {
        // The root path to run the application.
        root:"/minesweeper/"
    };

    // Localize or create a new JavaScript Template object.
    var JST = window.JST = window.JST || {};

    // Configure LayoutManager with Backbone Boilerplate defaults.
    Backbone.LayoutManager.configure({
        // Allow LayoutManager to augment Backbone.View.prototype.
        manage:true,

        prefix:"app/templates/",
        fetch:function (path) {
            path = path + ".html";

            if (!JST[path]) {
                $.ajax({ url:path, async:false }).then(function (contents) {
                    JST[path] = Handlebars.compile(contents);
                });
            }

            return JST[path];
        }
    });

    // Mix Backbone.Events, modules, and layout management into the app object.
    return _.extend(app, {
        // Create a custom object with a nested Views object.
        module:function (additionalProps) {
            return _.extend({ Views:{} }, additionalProps);
        },

        // Helper for using layouts.
        useLayout: function(name) {
            // If already using this Layout, then don't re-inject into the DOM.
            if (this.layout && this.layout.options.template === name) {
                return this.layout;
            }

            // Ensure previous layouts are completely removed.
            if (this.layout) {
                this.layout.remove();
            }

            // Create a new Layout.
            var layout = new Backbone.Layout({
                template: name,
                className: "layout " + name,
                id: "layout"
            });

            // Insert into the DOM.
            $("#main").empty().append(layout.el);

            // Render the layout.
            layout.render();

            // Cache the reference on the Router.
            this.layout = layout;

            // Return the reference, for later usage.
            return layout;
        }
    }, Backbone.Events);

});
