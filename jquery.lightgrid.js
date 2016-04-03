!function () {

    var Pagination = function (pageIndex, pageSize) {
        this.pageIndex = (pageIndex < 1 || isNaN(pageIndex)) ? 1 : pageIndex;
        this.pageSize = (pageSize < 1 || isNaN(pageSize)) ? 1 : pageSize;
        this.total = 0;
    };
    Pagination.prototype = {
        constructor: Pagination

      , setTotal: function (total) {
          if (isNaN(total)) {
              alert('返回的total必须是数字');
          }

          this.total = total;
          var pageTotal = this.pageTotal();
          if (this.pageIndex > pageTotal) {
              this.pageIndex = pageTotal;
          }
      }

      , pageTotal: function () {
          return Math.ceil(this.total / this.pageSize);
      }

      , prevPage: function () {
          return (this.pageIndex - 1) < 1 ? NaN : (this.pageIndex - 1);
      }

      , nextPage: function () {
          return this.pageIndex - this.pageTotal() + 1 > 0 ? NaN : (this.pageIndex - 0 + 1);
      }

      , startRowIndex: function () {
          return this.pageIndex == 0 ? NaN : (this.pageIndex - 1) * this.pageSize + 1;
      }

      , finishRowIndex: function () {
          return this.pageIndex == 0 ? NaN : this.pageIndex * this.pageSize;
      }
    }


    /* lightgrid Definition
    * ========================= */
    var LightGrid = function ($element, options) {
        // options
        this.setOptions(options);

        // model
        this.model = {
            entityArray: [],
            pagination: {},
            sortArray: [],
            searchArray: []
        };

        // view
        this.partialView_content = function (entityArray, startRowIndex) {
            var that = this;
            this.$tables.each(function () {
                var $table = $(this)
                  , $ths = $table.find(that.options.listHeadSelector)
                  , $tbody = $table.find(that.options.listBodySelector);

                $tbody.empty();
                for (index in entityArray) {
                    var entity = entityArray[index];
                    var row = '<tr>';

                    $ths.each(function () {
                        var $th = $(this)
                        , fieldName = $th.attr('data-field')
                        , cellHtml = that.options.fieldMapToCell(fieldName, entity, parseInt(index), startRowIndex);

                        row += cellHtml;
                    });
                    row += '</tr>';

                    $tbody.append(row);
                }
            });

        };
        this.partialView_page = function (pagination) {
            // 1.construct pageList
            if (!this.$pageList) {
                return;
            }

            this.$pageList.empty();
            if (pagination.total == 0) {
                this.$pageList.hide();
                return;
            }

            var pageIndex = pagination.pageIndex
              , pageTotal = pagination.pageTotal()
              , pageItemAmount = this.options.pageItemAmount
              , prevPage = pagination.prevPage()
              , nextPage = pagination.nextPage()
			  , that = this;

            // range
            var beginIndex = pageIndex - Math.floor(pageItemAmount / 2);
            if (beginIndex < 1) {
                beginIndex = 1;
            }

            var endIndex = beginIndex + pageItemAmount - 1;
            if (endIndex > pageTotal) {
                endIndex = pageTotal;
                beginIndex = endIndex - pageItemAmount + 1;
                if (beginIndex < 1) {
                    beginIndex = 1;
                }
            }

            // plain
            for (var index = beginIndex; index <= endIndex; index++) {
                var itemTemplate = (pageIndex == index) ? this.options.pageActiveItemTemplate : this.options.pageItemTemplate
                  , $pageItem = $(itemTemplate.replace('{0}', index));

                $pageItem
                    .on('click', function (event) {
                        event.preventDefault();
                        that.action_page(this.innerText);
                    })
                    .appendTo(this.$pageList);
            }

            // prev
            var prevItemTemplate = isNaN(prevPage) ? this.options.pageDisabledItemTemplate : this.options.pageItemTemplate
              , $pageItemPrev = $(prevItemTemplate.replace('{0}', '&laquo;'));
            if (!isNaN(prevPage)) {
                $pageItemPrev.on('click', function (event) {
                    event.preventDefault();
                    that.action_page(prevPage);
                });
            }
            $pageItemPrev.prependTo(this.$pageList);

            // next
            var nextItemTemplate = isNaN(nextPage) ? this.options.pageDisabledItemTemplate : this.options.pageItemTemplate
              , $pageItemNext = $(nextItemTemplate.replace('{0}', '&raquo;'));
            if (!isNaN(nextPage)) {
                $pageItemNext.on('click', function (event) {
                    event.preventDefault();
                    that.action_page(nextPage);
                });
            }
            $pageItemNext.appendTo(this.$pageList);

            this.$pageList.show();

            // 2.construct pageInfo
            if (!this.$pageInfo) {
                return;
            }

            var total = pagination.total
              , pageSize = pagination.pageSize
              , pageInfoText = this.options.pageInfoTemplate.replace('{pageIndex}', pageIndex).replace('{pageSize}', pageSize).replace('{pageTotal}', pageTotal).replace('{total}', total);

            this.$pageInfo.html(pageInfoText);
        };
        this.partialView_sort = function (sortArray) {
            var that = this;

            this.$sortThs.each(function () {
                var $sortTh = $(this)
                , sortName = $sortTh.attr('data-field')
                , sortInfoArray = $.grep(sortArray,
                    function (item, index) { return item.name == sortName; });

                if (sortInfoArray.length > 0) {
                    var sortDirection = sortInfoArray[0].value;
                    if (sortDirection) {
                        $sortTh.attr('aria-sort', 'ascending');
                        that.options.sortAsendingCallback($sortTh);
                    }
                    else {
                        $sortTh.attr('aria-sort', 'descending');
                        that.options.sortDescendingCallback($sortTh);
                    }
                }
                else {
                    $sortTh.attr('aria-sort', 'none');
                    that.options.sortNoneCallback($sortTh);
                }
            });
        };
        this.partialView_search = function (searchArray) {
        };

        // init
        this.init($element);
    };

    LightGrid.prototype = {
        constructor: LightGrid

      , init: function ($element) {
          // init dom element
          this.$tables = $element.find('table');
          this.$pageList = $element.find(this.options.pageListSelector);
          this.$pageInfo = $element.find(this.options.pageInfoSelector);
          this.$sortThs = $element.find(this.options.listHeadSelector).filter('[aria-sort]');
          this.$searchBoxes = $element.find(':input[data-search]');

          var that = this;

          // init pagination model
          that.model.pagination = new Pagination(this.options.pageIndex, this.options.pageSize);

          // init sort model
          this.$sortThs
              .css('cursor', 'pointer')
              .each(function () {
                  var $sortTh = $(this)
                  , sortName = $sortTh.attr('data-field')
                  , sortStatus = $sortTh.attr('aria-sort')
                  , sortDirection;

                  if (sortStatus == 'ascending') {
                      sortDirection = true;
                  }
                  else if (sortStatus == 'descending') {
                      sortDirection = false;
                  }
                  else {
                      sortDirection = null;
                  }

                  if (sortDirection != null) {
                      that.model.sortArray.push({ name: sortName, value: sortDirection });
                  }
              })
              .on('click', function (event) {
                  var $sortTh = $(this)
                  , sortName = $sortTh.attr('data-field')
                  , sortStatus = $sortTh.attr('aria-sort')
                  , sortDirection;

                  if (sortStatus == 'ascending') {
                      sortDirection = true;
                  }
                  else if (sortStatus == 'descending') {
                      sortDirection = false;
                  }
                  else {
                      sortDirection = null;
                  }

                  that.action_sort(sortName, !sortDirection, event.ctrlKey || event.metaKey);
              });;

          // init search model
          this.$searchBoxes
              .each(function () {
                  var $searchBox = $(this)
                  , searchName = $searchBox.attr('data-search')
                  , searchValue = $searchBox.val();

                  if (searchValue) {
                      that.model.searchArray.push({ name: searchName, value: searchValue });
                  }
              })
              .on('change', function (event) {
                  var $searchBox = $(this)
                  , searchName = $searchBox.attr('data-search')
                  , searchValue = $searchBox.val();

                  that.action_search(searchName, searchValue);
              });;
      }

      , getDataFromServer: function (pageIndex, pageSize, sortArray, searchArray, refreshPageView, refreshSortView, refreshSearchView) {
          var paramData = {
              pageIndex: pageIndex,
              pageSize: pageSize,
              sortArray: $.param(sortArray).replace(/\=/g, this.options.splitChar).split('&'),
              searchArray: $.param(searchArray).replace(/\=/g, this.options.splitChar).split('&'),
              time: new Date().getTime()
          };

          var that = this;

          that.options.onLoading(paramData);
          $.ajax({
              url: this.options.dataUrl,
              data: paramData,

              success: function (response) {
                  that.model.entityArray = response.entityArray;
                  that.model.pagination.setTotal(response.total);

                  that.options.onDrawing(that.model);

                  that.partialView_content(that.model.entityArray, parseInt(that.model.pagination.startRowIndex()));
                  refreshPageView && that.partialView_page(that.model.pagination);
                  refreshSortView && that.partialView_sort(that.model.sortArray);
                  refreshSearchView && that.partialView_search(that.model.searchArray);

                  that.options.onLoad(that.model);
              },
              error: function (jqXHR, textStatus, errorThrown) {
                  alert(errorThrown)
              },
              type: 'get',
              dataType: 'json'
          });
      }

      , setOptions: function (options) {
          this.options = options;
      }

      , getOptions: function () {
          return this.options;
      }

      , action_page: function (pageIndex) {
          // change pagination model
          this.model.pagination.pageIndex = pageIndex;

          // refresh
          this.action_refresh(true, false, false);
      }

      , action_sort: function (sortName, sortDirection, appendSort) {
          // change sort model
          var sortInfo = { name: sortName, value: sortDirection };
          if (appendSort) {
              var oldIndex = -1;

              $.each(this.model.sortArray, function (index, item) {
                  if (item.name == sortName) {
                      oldIndex = index;
                      return;
                  }
              });
              if (oldIndex != -1) {
                  this.model.sortArray.splice(oldIndex, 1);
              }
              this.model.sortArray.push(sortInfo);
          }
          else {
              this.model.sortArray = [sortInfo];
          }

          // refresh
          this.action_refresh(false, true, false);
      }

	  , action_search: function (searchName, searchValue) {
	      // change pagination model
	      this.model.pagination.pageIndex = 1;

	      // change search model
	      var searchInfo = { name: searchName, value: searchValue }
	        , oldIndex = -1;

	      $.each(this.model.searchArray, function (index, item) {
	          if (item.name == searchName) {
	              oldIndex = index;
	              return;
	          }
	      });
	      if (oldIndex != -1) {
	          this.model.searchArray.splice(oldIndex, 1);
	      }
	      if (searchValue) {
	          this.model.searchArray.push(searchInfo);
	      }

	      // refresh
	      this.action_refresh(true, false, true);
	  }

      , action_refresh: function (refreshPageView, refreshSortView, refreshSearchView) {
          this.getDataFromServer(this.model.pagination.pageIndex, this.model.pagination.pageSize, this.model.sortArray, this.model.searchArray, refreshPageView, refreshSortView, refreshSearchView);
      }

    };


    /* lightgrid Plugin Definition
    * ============================= */
    $.fn.lightgrid = function (option) {
        return this.each(function () {
            var $this = $(this)
              , lightgrid = $this.data('lightgrid');

            if (!lightgrid) {
                var options = $.extend({}, $.fn.lightgrid.defaults, typeof option == 'object' && option);
                $this.data('lightgrid', lightgrid = new LightGrid($this, options));
            }
            else {
                var options = $.extend({}, lightgrid.getOptions(), typeof option == 'object' && option);
                lightgrid.setOptions(options);
                lightgrid.init($this);
            }

            lightgrid.action_refresh(true, true, true);
        });
    };

    $.fn.lightgrid.defaults = {
        dataUrl: '',
        splitChar: '_',
        onLoading: function (paramData) { },
        onDrawing: function (model) { },
        onLoad: function (model) { },

        listHeadSelector: 'thead th',
        listBodySelector: 'tbody',
        fieldMapToCell: function (fieldName, entity, index, startRowIndex) {
            var cellContent = fieldName
                ? entity[fieldName]
                : startRowIndex + index;

            return '<td>' + cellContent + '</td>';
        },

        pageListSelector: 'ul.pagination',
        pageIndex: 1,
        pageSize: 10,
        pageItemAmount: 5,
        pageItemTemplate: '<li><a href="#">{0}</a></li>',
        pageActiveItemTemplate: '<li class="active"><a href="#">{0}</a></li>',
        pageDisabledItemTemplate: '<li class="disabled"><a href="#">{0}</a></li>',
        pageInfoSelector: '.pageInfo',
        pageInfoTemplate: '显示第 {pageIndex}/{pageTotal} 页，共 {total} 项记录',

        sortAsendingCallback: function ($sortTh) {
            if ($sortTh.find('.caret').length == 0) {
                $sortTh.append('<span class="caret"></span>');
            }
            $sortTh.addClass('dropup');
        },
        sortDescendingCallback: function ($sortTh) {
            if ($sortTh.find('.caret').length == 0) {
                $sortTh.append('<span class="caret"></span>');
            }
            $sortTh.removeClass('dropup');
        },
        sortNoneCallback: function ($sortTh) {
            $sortTh.removeClass('dropup').find('.caret').remove();
        },
    };

}(window.jQuery);