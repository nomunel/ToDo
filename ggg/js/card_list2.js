/*
 - PageViewの途中
  - ページリンクの表示を任意の数に随時変え、current処理 =>後回し
 - どこかに状態を保持
  - 全データを読んでいない状態からの再開が難しそう
 - ソート（優先度低：最悪リロードでも）
  - 一旦すべてのモデルをロードしてからソートして表示
  - ソート種別をサーバーサイドに送り、次からはソートされたjsonをもらう
 - drag後に一瞬固まるのを改善（優先度低）
  - 惰性で少し動くようにするとよい？Flipsnap参照
*/
var $debugLogElm = $('#debug_log')
function debugLog(msg){
    var $span = $('<span>' + msg + '</span>');
    $span.appendTo($debugLogElm);
    setTimeout(function(){
        $span.remove();
    }, 1200);
}

(function($) {
    $.listenEvents = {
        transitionend: [
            'webkitTransitionEnd',
            'oTransitionEnd',
            'otransitionend',
            'transitionend'
        ]
    };
    $.support.translate3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix();
    $.fn.translateX = function(x, duration){
        // var prop = ($.support.translate3d)
        //     ? 'translate3d(' + x +'px, 0, 0)'
        //     : 'translateX(' + x +'px)';
        // this.css('transform', prop);
        this.css('transform', 'translateX(' + x +'px)');
        this.css('transitionDuration', duration);
    }
})(jQuery);
// listenEvents使い方
// .on($.listenEvents.transitionend.join(' '), function);
// .off($.listenEvents.transitionend.join(' '), function);

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

    ns.CardView = Backbone.View.extend({
        events: {
            'touchend .select': 'toggle'
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
        tagName: 'ul',
        events: {
            'load img': 'hoge'
        },
        render: function(index){
            this.$el
            .css('left', ((index-1)*320)+'px')
            .attr('id', 'page'+index);
            _(this.items).each(function(item){
                var cardView = new ns.CardView({
                    model: item,
                    tagName: this.$cardTemplate.data('wrap')
                });
                cardView.template =  _.template(this.$cardTemplate.html());
                this.$el.append(cardView.render().el);
            }, this);
            return this;
        }
    });

    ns.CardPageView = Backbone.View.extend({
        initialize: function(){
            this.collection.fetch({
                error: $.proxy(this.error, this),
                success: $.proxy(function(){
                    var arr = [],
                        i, il;
                    for(i=0, il=this.preLoadPage+1; i<il; i++){
                        arr.push(this.currentPage+i);
                    }
                    this.grouping();
                    this.render(arr);
                    this.initRenderCompleted();
                    /* 
                    split時に2ファイル目以降のを指定されることを考慮すると
                    this.loadedJsonFiles<this.splitJson.length
                    でaddJsonする必要ある（優先度低）
                    */
                    this.$el.translateX(-320*(this.currentPage-1), '.3s');
                }, this)
            });
            this.loadedJsonFiles = 1;
            this.index = 0;
        },
        events: {
            'touchstart': function(){
                this.touchstartX = event.touches[0].pageX;
            },
            'touchmove': function(e){
                e.preventDefault();
                this.touchmoveX = event.touches[0].pageX;
                this.drag();
            },
            'touchend': function(){
                this.touchendX = event.changedTouches[0].pageX;
                this.pageMove();
            }
        },
        drag: function(){
            var diffX = this.touchstartX - this.touchmoveX,
                x = (this.currentPage-1) * 320 + diffX;
            this.$el.translateX(-x, '0');
        },
        pageMove: function(){
            var blankSpace = 40;
            if(this.touchstartX + blankSpace < this.touchendX){
                this.prev();
            }else if(this.touchstartX - blankSpace > this.touchendX){
                this.next();
            }else{
                this.$el.translateX(-320*(this.currentPage-1), '.3s');
            }
        },
        grouping: function(){
            var models = this.collection.models,
                groupItemNum = this.groupItemNum,
                groupNum = this.groupNum = Math.ceil(models.length / groupItemNum),
                groups = this.groups = [],
                i, from, to;
            for(i=1; i<=groupNum; i++) {
                from = (i-1) * groupItemNum;
                to = from + groupItemNum;
                groups[i] = models.slice(from, to);
                groups[i].index = i;
            }
        },
        render: function(addIndexs, removeIndexs){
            // if(!addIndexs){return;}
            var newGroups = [];
            _(addIndexs).each(function(index){
                if(!document.getElementById('page'+index)){
                    newGroups.push(this.groups[index] || null);
                }
            }, this);
            _(newGroups).each(function(group){
                if(group !== null){
                    var cardListView = new ns.CardListView();
                    cardListView.items = group;
                    cardListView.$cardTemplate = this.$cardTemplate;
                    this.$el.append(cardListView.render(group.index).el);
                    this.index++;
                }
            }, this);
            _(removeIndexs).each(function(index){
                var $elm = $('#page'+index);
                if($elm){
                    $elm.remove();
                }
            });
            this.$el.css('height', this.$el.children('ul')[0].offsetHeight);
        },
        initRenderCompleted: function(){
            console.log('No set of initRenderCompleted');
        },
        addJson: function(){
            var self = this,
                url = this.splitJson[this.loadedJsonFiles++].split_path;
            $.getJSON(url, function(datas){
                _(datas).each(function(data){
                    self.collection.create(data);
                });
                self.grouping();
            });
        },
        prev: function(){
            var self = this;
            $spinner.css('display', 'none');
            this.touchedNext = false;
            this.nextRenderBlock = false;
            this.nextLoaded = false;
            if(this.currentPage === 1){
                this.$el.translateX(-320*(this.currentPage-1), '.3s');
            }else{
                this.$el.translateX(-320*(this.currentPage-2), '.3s');
                this.render(
                    [this.currentPage -1 -this.preLoadPage],
                    [this.currentPage + this.preLoadPage]
                    );
                this.currentPage--;
                this.disableSwitch();
                this.$currentPageNums.html(this.currentPage);
            }
        },
        next: function(){
            var self = this;
            if(this.currentPage === this.maxGroupNum){
                this.$el.translateX(-320*(this.currentPage-1), '.3s');
            }
            else if(this.nextRenderBlock){
                this.$el.translateX(-320*(this.currentPage-1), '.3s');
                this.touchedNext = true;
                $spinner.css('display', 'block');
                debugLog('ロード中...')
                return;
            }
            else{
                this.nextRenderBlock = true;
                if(!(this.currentPage >= this.groups.length-this.preLoadPage-2)) {
                    $spinner.css('display', 'block');
                }
                if(this.currentPage === this.groups.length-this.preLoadPage-2){
                    if(this.loadedJsonFiles<this.splitJson.length){
                        this.addJson();
                    }
                }
                this.$el.translateX(-320*(this.currentPage), '.3s');
                this.render(
                    [this.currentPage +1 + this.preLoadPage],
                    [this.currentPage - this.preLoadPage]
                );
                var $img = this.$el.find('li:last-child figure img');
                $img.on('load', function(){
                    self.nextLoaded = true;
                });
                this.currentPage++;
                this.$currentPageNums.html(this.currentPage);
                this.disableSwitch();
                hoge();
            }
            function hoge(){
                if(!self.nextLoaded){
                    setTimeout(function(){
                        hoge();
                    }, 200);
                    return;
                }else{
                    if(self.touchedNext){
                        self.touchedNext = false;
                        self.nextRenderBlock = false;
                        self.nextLoaded = false;
                        self.next();
                    }else{
                        self.nextRenderBlock = false;
                        self.nextLoaded = false;
                    }
                    $spinner.css('display', 'none');
                }
            }
        },
        setPager: function(elms){
            var self = this;
            this.$firstBtns = elms.$firstBtns;
            this.$prevBtns = elms.$prevBtns;
            this.$nextBtns = elms.$nextBtns;
            this.$lastBtns = elms.$lastBtns;
            this.$currentPageNums = elms.$currentPageNums;
            this.$maxPageNums = elms.$maxPageNums;

            self.$currentPageNums.html(self.currentPage);
            self.$maxPageNums.html(self.maxGroupNum);
            self.disableSwitch();

            self.$firstBtns.on('touchend', function(){
                self.first();
            });
            self.$prevBtns.on('touchend', function(){
                self.prev();
            });
            self.$nextBtns.on('touchend', function(){
                self.next();
            });
            self.$lastBtns.on('touchend', function(){
                self.last();
            });
        },
        disableSwitch: function(){
            var self = this;
            enable(self.$firstBtns, self.$prevBtns, self.$nextBtns, self.$lastBtns);
            if(self.maxGroupNum === 1){
                disable(self.$firstBtns, self.$prevBtns, self.$nextBtns, self.$lastBtns);
            }else if(self.currentPage === 1){
                disable(self.$prevBtns, self.$firstBtns);
            }else if(self.currentPage === self.maxGroupNum){
                disable(self.$nextBtns, self.$lastBtns);
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
