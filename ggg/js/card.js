
// (function($){
// var User = Backbone.Model.extend({
//     defaults: {
//         'name': '',
//         'age': 0
//     }
// });
// var Users = Backbone.Collection.extend({
//        model: User,
//        url: '../json/data.json'
// });
// var UserView = Backbone.View.extend({
//     el: $('#view'),
//     initialize: function(){
//         this.collection = new Users();
//         this.collection.fetch({
//             error: $.proxy(this.error, this),
//             success: $.proxy(this.render, this)
//         });
//     },
//     render: function(){
//         _(this.collection.models).each(function(item){
//             this.appendItem(item);
//         }, this);
//     },
//     appendItem: function(item){
//         var user = {
//             name: item.get('name'),
//             age: item.get('age')
//         };
//         $(this.el).append(this.template(user));
//     },
//     error: function() {
//         $(this.el).append(this.template({name: '取得できませんでした。'}));
//     },
//     template: _.template("<li><%= name %> <% if(typeof(age) != 'undefined'){ %>(<%= age %>)<% } %></li>")
// });
// var staffView = new UserView();

// })(jQuery);



(function(global, document){
    // Model
    var Card = Backbone.Model.extend({
        defaults: {
        }
    });

    // Collection
    var Cards = Backbone.Collection.extend({
        model: Card,
        url: '../json/card_list_data_sample.json'
    });

    // View
    var CardView = Backbone.View.extend({
        el: $('#m_cards'),
        initialize: function(){
            this.collection = new Cards();
            this.collection.fetch({
                // error: $.proxy(this.error, this),
                success: $.proxy(this.render, this)
            });
        },
        template: _.template($('#card_list_template').html()),
        render: function(){
            var template = this.template(this.model);
            this.$el.html(template);
            return this;
        }
    });
    var cardView = new CardView();
})(this, this.document);


if(window.JSON){
    // JSON.parse( text[, reviver] )
}
