/*
 - 画像の先読みをする
  - 先に次のグループを見えないところにRenderingしたら画像ロードするか確認
 - PageViewの途中
  - ページリンクの表示を任意の数に随時変え、current処理 =>後回し
 - どこに状態を保持
  - 全データを読んでいない状態からの再開が難しそう
 - ソート（優先度低：最悪リロードでも）
  - 一旦すべてのモデルをロードしてからソートして表示
  - ソート種別をサーバーサイドに送り、次からはソートされたjsonをもらう
 - フリック操作
  - これは簡単
 - 切り替えアニメーション（少し鬼門）
  - jsonの先読みをもう1ページ早めないといけないかも
  - 前後のDOMを用意しておく必要がある
*/
(function(global){
    var ns = global.ggg || (global.ggg={});
    ns.Card = Backbone.Model.extend({
        defaults: {
            "card_name": "Unknown",
            "card_id": 0,
            "checked": false,
            "img_loaded": false
        }
    });
    ns.Cards = Backbone.Collection.extend({
        model: ns.Card
    });
    ns.CardView = Backbone.View.extend({
        events: {
            'click .select': 'toggle'
        },
        toggle: function(){
            this.model.set('checked', !this.model.get('checked'));
        },
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });
    ns.CardListView = Backbone.View.extend({
        el: $('#m_cards'),
        initialize: function(){
            var self = this;
            this.collection.fetch({
                error: $.proxy(this.error, this),
                success: $.proxy(this.render, this)
            });
            this.loadedJsonFiles = 1;
        },
        error: function() {
            $(this.el).append('JSONデータを取得できませんでした');
        },
        render: function(add){
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
                this.pageChange(groups[this.currentPage]);
                this.renderCompleted();
            }
        },
        pageChange: function(group){
            var tagName = this.$cardTemplate.data('wrap');
            $(this.el).empty();
            _(group).each(function(item){
                var cardView = new ns.CardView({
                    model: item,
                    tagName: tagName
                });
                cardView.template = _.template(this.$cardTemplate.html());
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
            var self = this;
            if(this.splitJson && (this.currentPage === this.groups.length -2) && this.loadedJsonFiles<this.splitJson.length){
                var url = this.splitJson[this.loadedJsonFiles++].split_path;
                $.getJSON(url, function(datas){
                    _(datas).each(function(data){
                        self.collection.create(data);
                    });
                    // datas.forEach(function(data){
                    //     opt.collection.create(data);
                    // });
                    // var i, il;
                    // for(i=0, il=datas.length; i<il; i++){
                    //     opt.collection.create(datas[i]);
                    // }
                    self.render(true);
                });
            }
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
            this.currentPage = this.maxGroupNum;
            this.pageChange(this.groups[this.currentPage]);
        },
        setPager: function(elms){
            var self = this,
                $firstBtns = elms.$firstBtns,
                $prevBtns = elms.$prevBtns,
                $nextBtns = elms.$nextBtns,
                $lastBtns = elms.$lastBtns,
                $currentPageNums = elms.$currentPageNums,
                $maxPageNums = elms.$maxPageNums;
            disableSwitch();

            $firstBtns.on('click', function(){
                self.first();
                disableSwitch();
                $currentPageNums.html(self.currentPage);
            });
            $prevBtns.on('click', function(){
                self.prev();
                disableSwitch();
                $currentPageNums.html(self.currentPage);
            });
            $nextBtns.on('click', function(){
                self.next();
                disableSwitch();
                $currentPageNums.html(self.currentPage);
            });
            $lastBtns.on('click', function(){
                self.last();
                disableSwitch();
                $currentPageNums.html(self.currentPage);
            });
            function disableSwitch(){
                enable($firstBtns, $prevBtns, $nextBtns, $lastBtns);
                if(self.maxGroupNum === 1){
                    disable($firstBtns, $prevBtns, $nextBtns, $lastBtns);
                }else if(self.currentPage === 1){
                    disable($prevBtns, $firstBtns);
                }else if(self.currentPage === self.maxGroupNum){
                    disable($nextBtns, $lastBtns);
                }
                function disable(){
                    _(arguments).each(function(btn){
                        btn.attr('disabled', 'disabled');
                    });
                }
                function enable(){
                    _(arguments).each(function(btn){
                        btn.removeAttr('disabled');
                    });
                }
            }
            $currentPageNums.html(self.currentPage);
            $maxPageNums.html(self.maxGroupNum);
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
