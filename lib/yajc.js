/* ===================================================
 * yajc.js v0.0.1
 * https://github.com/buunguyen/yajc
 * ===================================================
 * Copyright 2012 Buu Nguyen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */
(function($) {
	var _ = {
		slice: function(array) {
			return Array.prototype.slice.apply(array, 
				Array.prototype.slice.call(arguments, 1));
		},

		is$: function(obj) {
			return obj instanceof $;
		},

		isUndefined: function(obj) {
			return typeof obj === 'undefined';
		}
	};

	$.each(['Array', 'Function', 'String', 'Number', 'Date', 'Arguments', 'RegExp'], function (index, name) {
        _['is' + name] = function (obj) {
            return obj && Object.prototype.toString.call(obj) === '[object ' + name + ']';
        };
    })

	var core = {
		_slideList: function($root, $list, from, to, options) {
			if (from === to) return;

			var msPer100px = $root.data('options').msPer100px,
				rootWidth = $root.width(),
				listWidth = $list.outerWidth(true),
				minLeft = -(listWidth - rootWidth);

			if (to > 0) to = 0;
			else if (to < minLeft) to = minLeft;
			
			if (to === from) return;

			$list.stop(true, false);
			if (msPer100px === 0) {
				$list.css('left', to);
				if (options.callback) options.callback();
			} else {
				$list.animate(
					{ left: to }, 
					{
						duration: (Math.abs(to - from) / 100) * msPer100px,
						queue: false,
						easing: options.easing,
						complete: options.callback || $.noop
					}
				); 	
			}
		},

		// Sets up carousel with options
		init: function(options) {
			return this.each(function() {
				var $root = $(this).append('<div class="yajc">' +
				 						   	  '<ul class="items"></ul>' +
				 						   '</div>');

	    		$root.data('options', $.extend({}, $.fn.yajc.defaults, options));
				$(window).resize(function() {
					$root.yajc('refresh');
				});
				$root.yajc('refresh');
			});
		},

		// Adds an item
		//	target: DOM or jQuery object
		//	index (optional): position to insert to, default last position
		//	callback (optional): callback invoked when the item has been added
		//	Note: if options.addDuration is 0, this call is synchronous
		//		  and the callback is invoked immediately
		add: function(target, index, callback) {
			return this.each(function() {
				var $root = $(this),
					$list = $root.find('.items'),
					addDuration = $root.data('options').addDuration;

				if (!_.is$(target))
					target = $(target);

				if (_.isFunction(index) && _.isUndefined(callback))
					callback = index;
				
				if (!_.isNumber(index))
					index = $list.children().length;

				var cb = function() {
					$root.yajc('refresh');
					if (callback) callback();
				};
				if (addDuration === 0) {
					if (index === 0) target.prependTo($list);
					else $list.find('li:nth-child(' + index + ')').after(target);
					cb();
				} else {
					if (index === 0) target.hide().prependTo($list).show(addDuration, cb);
					else {
						$list.find('li:nth-child(' + index + ')').after(target.hide());
						target.show(addDuration, cb);
					}
				}
			});
		},

		// Removes an item
		//	target: DOM object, jQuery object or index to be removed
		//	callback (optional): callback invoked when the item has been removed
		//	Note: if options.removeDuration is 0, this call is synchronous
		//		  and the callback is invoked immediately
		remove: function(target, callback) {
			return this.each(function() {
				var $root = $(this),
					$list = $root.find('.items'),
					removeDuration = $root.data('options').removeDuration;

				if (_.isNumber(target)) 
					target = $list.find('li:nth-child(' + (target+1) + ')');
				else if (!(target instanceof $))
					target = $(target);

				var remove = function() {
					target.remove();
					$root.yajc('refresh');
					if (callback) callback();
				};

				if (removeDuration === 0) remove();
				else target.hide(removeDuration, remove);
			});
		},

		// Centers an item in viewport
		//	target: DOM object, jQuery object or index to be shown
		//	callback (optional): callback invoked when the item is completely in view
		//	Note: if options.msPer100px is 0, this call is synchronous
		//		  and the callback is invoked immediately
		show: function(target, callback) {
			return this.each(function() {
				var $root = $(this),
					$list = $root.find('.items'),
					$children = $list.children(),
					rootWidth = $root.width(),
					to = 0, found = false;

				if (!_.isNumber(target) && !_.is$(target))
					target = $(target);

				for (var i = 0; i < $children.length; i++) {
					if (i === target || $children[i] === target[0]) {
						target = $($children[i]); // normalize target
						found = true;
						break;
					}
					to -= $($children[i]).outerWidth(true);
				}
				if (!found) return;

				to += rootWidth/2 - target.width()/2;
				core._slideList($root, $list, $list.position().left, to, {
					easing: $root.data('options').showEasing,
					callback: callback
				});
			});
		},

		// Slides to a position or by an offset
		//	to: the position to slide to; if is prefixed with += or -=, the offset to slide by
		//	callback (optional): callback invoked when sliding completes
		//	Note: if options.msPer100px is 0, this call is synchronous
		//		  and the callback is invoked immediately
		slide: function(to, callback) {
			return this.each(function() {
				var $root = $(this),
					$list = $root.find('.items'),
					from = $list.position().left;

				if (_.isString(to)) {
					to = $.trim(to);
				 	if (to.indexOf('+=') === 0 || to.indexOf('-=') === 0) 
						to = (to.indexOf('-=') === 0 ? -1 : 1) * 
							 (parseInt(to.substring(2), 10) || 0) + 
						 	 from;
					else to = parseInt(to.substring(2), 10) || 0;
				}

				core._slideList($root, $list, from, to, {
					easing: $root.data('options').slideEasing,
					callback: callback
				});
			});			
		},		

		// Stops sliding immediately
		stop: function() {
			return this.each(function() {
				var $root = $(this);
				$root.find('.items').stop(true, true);
			});					
		},

		// Refreshes the careusel should there is any change
		//	callback (optional): callback invoked when refreshing is completed
		refresh: function(callback) {
			return this.each(function() {
				var $root = $(this),
					rootWidth = $root.width(),
					rootHeight = $root.height(),
						$list = $root.find('.items'),
						listWidth = 0,
						maxItemHeight = 0, 
						widthFromRootLeft, currentLeft;

				$list.children().each(function() {
					var $this = $(this),
						itemHeight = $this.outerHeight(true);
				    listWidth += $this.outerWidth(true);
				    if (maxItemHeight < itemHeight) 
				    	maxItemHeight = itemHeight;
				});

				// Set container's height if not specified
				if (rootHeight === 0) 
					$root.height(maxItemHeight);

				$list.height($root.height() + 'px')
					 .width(Math.max(rootWidth, listWidth) + 'px');

				// Adjust 'left' when an item is removed
				currentLeft = $list.position().left;
				widthFromRootLeft = $list.outerWidth(true) + currentLeft;
				if (widthFromRootLeft < rootWidth)  {
					core._slideList($root, $list, currentLeft, currentLeft + (rootWidth-widthFromRootLeft), {
						easing: $root.data('options').slideEasing,
						callback: callback
					});
				} else if (callback) callback();
			});
		}
	};

	$.fn.yajc = function(method) {
		var methods = $.fn.yajc.plugins;
	    if (typeof method === 'object' || !method) 
	    	return methods.init.apply(this, arguments);
	   	else if (methods[method]) 
	      	return methods[method].apply(this, _.slice(arguments, 1));
	    else $.error( 'Method ' +  method + ' does not exist on jQuery.yajc' );
  	};

  	$.fn.yajc.plugins = {};
  	$.each(core, function(name, method) {
  		if (name.indexOf('_') === 0) return;
  		$.fn.yajc.plugins[name] = method;
  	});

  	$.fn.yajc.defaults = {
		addDuration: 0,
	    removeDuration: 0,
	    msPer100px: 100,
	    showEasing: 'swing',
	    slideEasing: 'linear'
  	}; 


	/* ===================================================
	 * selectOn v0.0.1
	 * ===================================================
	 * Copyright 2012 Buu Nguyen
	 *
	 * Auto-slide carousel as events are performed on items. Mark selected items with 'selected' class.
	 * ========================================================== */
	$.fn.yajc.plugins.selectOn = function(events, callback) {
		return this.each(function() {
			var $root = $(this);
			$root.find('li').live(events,
				function() {
					var self = this, $self = $(self);
					$self.addClass('selected').siblings().removeClass('selected');
					$root.yajc('show', $self, function() {
						if (callback) callback.call(self);
					});
				}
			);
		});
	}


	/* ===================================================
	 * hoverSlide v0.0.1
	 * ===================================================
	 * Copyright 2012 Buu Nguyen
	 *
	 * Auto-slide carousel as mouse is hovered.
	 * ========================================================== */
	$.fn.yajc.plugins.hoverSlide = function(callback) {
		var size = function($el, name) {
			return parseInt($el.css(name), 10) || 0;
		};

		return this.each(function() {
			var $root = $(this),
				$list = $root.find('.items');
				
			$list.mousemove(function(e) {
				var rootWidth = $root.width(),
					listWidth = $list.width() - rootWidth,
					rootXOffset = $root.offset().left + 
							  	  size($root, 'padding-left') +
							  	  size($root, 'margin-left') +
							  	  size($root, 'border-left'),
					mouseXFromRootLeft = e.pageX - rootXOffset,
					mouseXFromListLeft = (mouseXFromRootLeft * listWidth) / rootWidth;
				$root.yajc('stop').yajc('slide', -mouseXFromListLeft, function() {
					if (callback) callback();
				});
			});
		});
	}


	/* ===================================================
	 * wings v0.0.1
	 * ===================================================
	 * Copyright 2012 Buu Nguyen
	 *
	 * Provides slide left and slide right wings.
	 * ========================================================== */

	// style: 'pad' (default) or 'circle'
	$.fn.yajc.plugins.wings = function(style) {
		return this.each(function() {
			var $root = $(this),
				$list = $root.find('.items'),
				$backwardWing = $('<a class="wing backward">‹</a>'),
				$forwardWing = $('<a class="wing forward">›</a>'),
				$bothWings = $backwardWing.add($forwardWing),
				isLineHeightSet = false;

			if (style !== 'pad' && style !== 'circle')
				style = 'pad';
			$bothWings.addClass(style);
			
			$root.find('.yajc').append($bothWings);
			var slide = function(offset) {
				if ($root.data('sliding')) {
					$root.yajc('slide', '+=' + offset, function() {
						slide(offset);
					});
				}
			};

			var out = function() {
				$root.data('sliding', false).yajc('stop');
			};

			var setLineHeight = function() {
				if (style === 'pad' && !isLineHeightSet) { 
					// @TODO: Dynamic line-height to v-center text, find a CSS-only way that 
					// doesn't need different HTML tags
					$bothWings.css('line-height', $list.outerHeight(true) + 'px');
					isLineHeightSet = true;
				}
			}

			$backwardWing.hide().hover(
				function() {
					setLineHeight();
					$root.data('sliding', true);
					slide(10);
				}, out
			);

			$forwardWing.hide().hover(
				function() {
					$root.data('sliding', true);
					slide(-10);
				}, out
			);

			$root.hover(
				function() { 
					setLineHeight();
					$bothWings.stop(true, true).fadeIn();
				}, 
				function() { 
					$bothWings.stop(true, true).fadeOut();
				}
			);
		});	
	};
})(jQuery);