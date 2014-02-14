(function(global){
    var ns = global.ggg || (global.ggg={});

    ns.Card = Backbone.Model.extend({
        defaults: {
            "card_name": "Unknown",
            "card_id": 0,
            "checked": false
        }
    });

    ns.Cards = Backbone.Collection.extend({
        model: ns.Card
    });

    var $cardTemplate = $('#card_template');
    ns.CardView = Backbone.View.extend({
        tagName: $cardTemplate.data('wrap'),
        events: {
            'click .select': 'toggle'
        },
        toggle: function(){
            this.model.set('checked', !this.model.get('checked'));
        },
        template:  _.template($cardTemplate.html()),
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    ns.CardListView = Backbone.View.extend({
        tagName: 'ul',
        events: {

        },
        render: function(){
            _(this.items).each(function(item){
                var cardView = new ns.CardView({model: item});
                $(this.el).append(cardView.render().el);
            }, this);
            return this;
        }
    });

    ns.CardPageView = Backbone.View.extend({
        el: $('#m_cards'),
        initialize: function(){
            this.collection.fetch({
                error: $.proxy(this.error, this),
                success: $.proxy(this.grouping, this)
            });
            this.loadedJsonFiles = 1;
        },
        grouping: function(add){
            var models = this.collection.models,
                groupItemNum = this.groupItemNum,
                groupNum = this.groupNum = Math.ceil(models.length / groupItemNum),
                groups = this.groups = [],
                i, from, to;
            for(i=1; i<=groupNum; i++) {
                from = (i-1) * groupItemNum;
                to = from + groupItemNum;
                groups[i] = models.slice(from, to);
            }
            if(add!==true){
                this.render();
                // this.renderCompleted();
            }
        },
        render: function(){
            _(this.groups).each(function(group){
                var cardListView = new ns.CardListView();
                cardListView.items = group;
                $(this.el).append(cardListView.render().el);
            }, this);
        },
        addJson: function(){
            var self = this,
                url = this.splitJson[this.loadedJsonFiles++].split_path;
            console.log(url);
            $.getJSON(url, function(datas){
                _(datas).each(function(data){
                    self.collection.create(data);
                });
                self.grouping('add');
                self.render(true);
            });

        }
    });
    ns.SubmitCardsView = Backbone.View.extend({
        el: $('#card_selector'),
        events: {
            'submit': 'submit',
        },
        // * selectNames/Idsを作らなくてもCollectionに保持しているからそれ使えばいいかも...
        submit: function(e){
            e.preventDefault();
            var models = this.collection.models,
                selectNames = [],
                selectIds = [],
                msg;
            _(models).each(function(item){
                if(item.get('checked')){
                    selectIds.push(item.get('card_id'));
                    selectNames.push(item.get('card_name'));
                }
            });
            if(selectIds.length === 0){
                alert('カードが選択されていません');
            }else{
                msg = 'このカードでいいですか？\n' + selectNames;
                if(confirm(msg)){
                    alert(selectIds + 'が送信されました');
                }
            }
        }
    });

    // var Page = Backbone.Model.extend({
    //     defaults: {
    //         pageNum: 0,
    //         current: false
    //     }
    // })
    // var Pages = Backbone.Collection.extend({
    //     model: Page
    // });
    // var PageView = Backbone.View.extend({
    //     el: $('#pages'),
    //     template: _.template($('#card_list_pager').html()),
    //     render: function(){
    //         this.$el.html(this.template(this.model.toJSON()));
    //         return this;
    //     }
    // });


    // var pages = new ns.Pages();
    // var pageView = new ns.PageView({model: pages});
    // pageView.render();
})(this);


if(window.JSON){
    // JSON.parse( text[, reviver] )
}
