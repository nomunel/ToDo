/*
 - 画像の先読みをする
  - 先に次のグループを見えないところにRenderingしたら画像ロードする確認
  - ロードした画像のキャッシュを消す方を調べる
 - PageViewの途中
  - 子数をgroupNumから拾ってくる
  - ページリンクの表示を任意の数に随時変え、current処理
*/
(function(global){
    var ns = global.ggg || (global.ggg={}),
        $cardTemplate = $('#card_template'),
        Card,
        Cards,
        CardView,
        CardListView;
    Card = Backbone.Model.extend({
        defaults: {
            "card_name": "Unknown",
            "card_id": 0,
            "checked": false,
            "img_loaded": false
        }
    });
    Cards = Backbone.Collection.extend({
        model: Card,
        url: '../json/card_list_data.json'
    });
    CardView = Backbone.View.extend({
        tagName: $cardTemplate.data('wrap'),
        events: {
            'click .select': 'toggle'
        },
        toggle: function(){
            this.model.set('checked', !this.model.get('checked'));
        },
        template: _.template($cardTemplate.html()),
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });
    CardListView = Backbone.View.extend({
        el: $('#m_cards'),
        initialize: function(){
            this.itemNum = 10;
            this.currentPage = 1;
            this.collection.fetch({
                error: $.proxy(this.error, this),
                success: $.proxy(this.render, this)
            });
        },
        error: function() {
            $(this.el).append('JSONデータを取得できませんでした');
        },
        render: function(){
            var models = this.collection.models,
                itemNum = this.itemNum,
                groupNum = this.groupNum = Math.ceil(models.length / itemNum),
                groups = this.groups = [],
                i, from, to;
            for(i=1; i<=groupNum; i++) {
                from = (i-1) * itemNum;
                to = from + itemNum;
                groups[i] = models.slice(from, to);
            }
            this.pageChange(groups[this.currentPage]);
            this.renderCompleted();
        },
        pageChange: function(group){
            $(this.el).empty();
            _(group).each(function(item){
                var cardView = new CardView({model: item});
                $(this.el).append(cardView.render().el);
            }, this);
        },
        renderCompleted: function(){
            console.log('No set of renderCompleted');
        },
        prev: function(){
            if (this.currentPage !== 1) {
                this.currentPage--;
                this.pageChange(this.groups[this.currentPage]);
            };
        },
        next: function(){
            if (this.currentPage !== this.groups.length -1) {
                this.currentPage++;
                this.pageChange(this.groups[this.currentPage]);
            };
        },
        first: function(){
            this.currentPage = 1;
            this.pageChange(this.groups[this.currentPage]);
        },
        last: function(){
            this.currentPage = this.groupNum;
            this.pageChange(this.groups[this.currentPage]);
        }
    });
    var SubmitCardsView = Backbone.View.extend({
        el: $('#card_selector'),
        events: {
            'submit': 'submit',
        },
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
    var Page = Backbone.Model.extend({
        defaults: {
            pageNum: 0,
            current: false
        }
    })
    var Pages = Backbone.Collection.extend({
        model: Page
    });
    var PageView = Backbone.View.extend({
        el: $('#pages'),
        template: _.template($('#card_list_pager').html()),
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    // instancef
    var cards = new Cards();
    var cardListView = new CardListView({collection: cards});
    cardListView.renderCompleted = function(){
        var self = this,
            $prevBtn = $('#prevBtn'),
            $nextBtn = $('#nextBtn'),
            $firstBtn = $('#firstBtn'),
            $lastBtn = $('#lastBtn');
        disableSwitch();
        function disableSwitch(){
            enableBtn($firstBtn, $prevBtn, $nextBtn, $lastBtn);
            if(self.groupNum === 1){
                disableBtn($firstBtn, $prevBtn, $nextBtn, $lastBtn);
            }else if(self.currentPage === 1){
                disableBtn($prevBtn, $firstBtn);
            }else if(self.currentPage === self.groupNum){
                disableBtn($nextBtn, $lastBtn);
            }
        }
        function disableBtn(){
            _(arguments).each(function(btn){
                btn.attr('disabled', 'disabled');
            });
        }
        function enableBtn(){
            _(arguments).each(function(btn){
                btn.removeAttr('disabled');
            });
        }
        $firstBtn.on('click', function(){
            self.first();
            disableSwitch();
        });
        $prevBtn.on('click', function(){
            self.prev();
            disableSwitch();
        });
        $nextBtn.on('click', function(){
            self.next();
            disableSwitch();
        });
        $lastBtn.on('click', function(){
            self.last();
            disableSwitch();
        });
    }
    var submitCardsView = new SubmitCardsView({collection: cards});

    var pages = new Pages();
    var pageView = new PageView({model: pages});
    pageView.render();
    ns.Card = Card;
    ns.Cards = Cards;
    ns.CardView = CardView;
    ns.CardListView = CardListView;
})(this);


if(window.JSON){
    // JSON.parse( text[, reviver] )
}
console.log(ggg.CardListView);
