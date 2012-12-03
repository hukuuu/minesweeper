// Field module
define([
    // Application.
    "app",
    "modules/Game"
],

// Map dependencies from above array.
    function (app, Game) {

        // Create a new module.
        var Game = app.module();

        Game.Statuses = {
            opened:'opened',
            closed:'closed',
            flagged:'flagged'
        }
        Game.Levels = {
            easy:{
                mines:10,
                x:9,
                y:9
            },
            medium : {
                mines:40,
                x:16,
                y:16
            }
        }

        // Default Model.
        Game.Model = Backbone.Model.extend({
            defaults:{
                value:0,
                status:Game.Statuses.closed
            },
            initialize:function () {
                this.id = this.get('x') + ',' + this.get('y');
            }
        });

        // Default Collection.
        Game.Collection = Backbone.Collection.extend({
            model:Game.Model,
            initialize:function () {
                this.populatePoints(Game.selectedLevel.x, Game.selectedLevel.y);
                this.populateMines(Game.selectedLevel.mines);
                this.setValues();

            },

            populatePoints:function (x, y) {
                var model,
                    i, j;
                for (i = 0; i < x; i++) {
                    for (j = 0; j < y; j++) {
                        model = new Game.Model({x:i, y:j});
                        this.push(model);
                    }
                }
            },

            populateMines:function (mines) {
                var x = Game.selectedLevel.x,
                    y = Game.selectedLevel.y,
                    randomX,
                    randomY,
                    counter = 0,
                    current;

                while (counter < mines) {
                    randomX = Math.floor(Math.random() * x);
                    randomY = Math.floor(Math.random() * y);

                    current = this.get(randomX + ',' + randomY);
                    if (current && current.get('value') !== -1) {
                        current.set('value', -1);
                        counter++;
                    }

                }

            },

            getNeighbors:function (model, searchCriteria) {
                var x = model.get('x'),
                    y = model.get('y'),
                    neighbors = [],
                    me = this,
                    current,
                    cX, cY;

                _([-1, 0, 1]).each(function (i) {
                    _([-1, 0, 1]).each(function (j) {

                        if ((i == 0) && (j == 0)) {
                        } else {
                            cX = x + i;
                            cY = y + j;
                            current = me.get(cX + ',' + cY);
                            if (current) {
                                if (searchCriteria) {
                                    if (searchCriteria.value == current.get(searchCriteria.key)) {
                                        neighbors.push(current);
                                    }
                                } else {
                                    neighbors.push(current);
                                }
                            }
                        }

                    });
                });
                return neighbors;
            },

            setValues:function () {
                var me = this;
                this.forEach(function (model) {
                    if (model.get('value') !== -1) {
                        var mines = me.getNeighbors(model, {
                            key:'value',
                            value:-1
                        });
                        if (mines) {
                            model.set('value', mines.length);
                        }
                    }
                });
            },

            openField:function (model) {

                var me = this;

                function openRecursive(model) {
                    switch (model.get('value')) {
                        case -1:
                            console.log('game over');
                            break;
                        case 0 :
                            model.set('status', Game.Statuses.opened);
                            var neighbors = me.getNeighbors(model, {
                                key:'status',
                                value:Game.Statuses.closed
                            });
                            neighbors.forEach(function (n) {
                                openRecursive(n);
                            });
                            break;
                        default:
                            model.set('status', Game.Statuses.opened);
                    }
                }

                openRecursive(model);

            },

            revealNeighbors:function (model) {
                var closedNeighbors = this.getNeighbors(model, {
                    key:'status',
                    value:Game.Statuses.closed
                });

                var flaggedNeighbors = this.getNeighbors(model,{
                    key:'status',
                    value: Game.Statuses.flagged
                })
                console.log(flaggedNeighbors.length);
                console.log(model.get('value'));
                if(model.get('value') <= flaggedNeighbors.length){
                    closedNeighbors.forEach(function (n) {
                        this.openField(n);
                    },this);
                }

            }

        });

        Game.Views.SingleField = Backbone.View.extend({
            template:'field-main',
            tagName:'div',
            className:'inline-block',

            initialize:function () {
                this.model.on('change', this.render, this);
            },

            data:function () {
                return this.model.toJSON();
            },

            events:{
                'mousedown div[class*="field-box"]':'handleClick',
                'dblclick div[class*="field-box"]':'revealNeighbors',
                'contextmenu div[class*="field-box"]':function () {
                    return false
                }
            },
            handleClick:function (event) {
                switch (event.button) {
                    case(0):
                        this.leftClick();
                        break;
                    case(1):
                        this.revealNeighbors();
                        break;
                    case(2):
                        this.rightClick();
                        break;
                    default :
                        throw('cannot recognize button' + event.button);
                }
            },
            revealNeighbors:function (event) {
                if(this.model.get('status') == Game.Statuses.opened){
                    this.model.collection.revealNeighbors(this.model);
                }
            },
            leftClick:function () {
                if (this.model.get('status') == Game.Statuses.closed) {
                    //this.model.set('status', Game.Statuses.opened);
                    this.model.collection.openField(this.model);
                }
            },
            rightClick:function () {
                if (this.model.get('status') == Game.Statuses.closed) {
                    this.model.set('status', Game.Statuses.flagged);
                } else if (this.model.get('status') == Game.Statuses.flagged) {
                    this.model.set('status', Game.Statuses.closed);
                }
            }


        });

        Game.Views.Table = Backbone.View.extend({
            tagName:'div',
            template:'table',
            level:Game.Levels.easy,


            initialize:function () {


                Game.selectedLevel = Game.Levels.easy;
                this.$el.addClass('cells-' + Game.selectedLevel.x);

                this.collection = new Game.Collection();
                this.collection.forEach(function (item) {
                    this.insertView(new Game.Views.SingleField({model:item}));
                }, this);

            },

            data:function () {
                return {fields:this.collection.toJSON()};
            }
        });

        // Return the module for AMD compliance.
        return Game;

    });
