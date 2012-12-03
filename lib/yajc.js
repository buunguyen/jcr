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
        isTouchDevice: function() {
            return ('ontouchstart' in window) || 
                   (window.DocumentTouch && document instanceof DocumentTouch);
        },

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

    $.each(['Array', 'Function', 'Number', 'String', 'Date', 'Arguments', 'RegExp'], function (index, name) {
        _['is' + name] = function (obj) {
            return obj !== null && 
                   typeof obj !== 'undefined' && 
                   Object.prototype.toString.call(obj) === '[object ' + name + ']';
        };
    });

    var core = {
        _slideList: function($root, $list, from, to, options) {
            if (from === to) return;

            var msPer100px = $root.data('options').msPer100px,
                rootWidth = $root.width(),
                listWidth = $list.outerWidth(true),
                minLeft = -(listWidth - rootWidth),
                callback = options.callback || $.noop;

            if (to > 0) to = 0;
            else if (to < minLeft) to = minLeft;
            if (to === from) return;

            $list.stop(true, false);
            if (msPer100px === 0) {
                $list.css('left', to);
                callback();
            } else {
                $list.animate(
                    { left: to }, 
                    {
                        duration: (Math.abs(to - from) / 100) * msPer100px,
                        queue: false,
                        easing: options.easing,
                        complete: callback
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
                
                if (_.isTouchDevice()) 
                    $root.find('.yajc').addClass('touch');

                $(window).resize(function() {
                    $root.yajc('refresh');
                });
                $root.yajc('refresh');
            });
        },

        // Adds an item
        //  target: either a DOM element or a jQuery object to be added
        //  index (optional): the position to add to, default is the last position
        //  callback (optional): the callback to be invoked when add animation finishes
        //  Note: if options.addDuration is 0, this call is synchronous
        //        and the callback is invoked immediately
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

                if (addDuration > 0) target.hide();
                
                if (index === 0) target.prependTo($list); // @TODO: this doesn't seem to animate
                else $list.find('li:nth-child(' + index + ')').after(target);

                if (addDuration > 0) target.show(addDuration, cb);
                else cb();
            });
        },

        // Removes an item
        //  target: either a DOM element, a jQuery object or an index to be removed
        //  callback (optional): the callback to be invoked when remove animation finishes
        //  Note: if options.removeDuration is 0, this call is synchronous
        //        and the callback is invoked immediately
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
        //  target: either a DOM element, an jQuery object, an index, 'next' or 'previous'
        //  callback (optional): the callback to be invoked when the item is completely centered in view
        //  Note: if options.msPer100px is 0, this call is synchronous
        //        and the callback is invoked immediately
        show: function(target, callback) {
            return this.each(function() {
                var $root = $(this),
                    $list = $root.find('.items'),
                    $children = $list.children(),
                    rootWidth = $root.width(),
                    from = $list.position().left,
                    to = 0, 
                    childWidth, offset;

                if (_.isString(target)) {
                    if (target !== 'next' && target !== 'prev' && target !== 'previous') {
                        $.error('Invalid string target');
                        return false;
                    }
                    offset = from;
                    $children.each(function(index) {
                        childWidth = $(this).outerWidth(true);
                        if (offset+childWidth >= rootWidth/2) {
                            if (target === 'next')
                                target = Math.min(index + 1, $children.length - 1);
                            else {
                                // Handle the case when the right-edge is exactly 
                                // at the middle point, 'prev' should show that
                                // same element instead of the previous element
                                if (offset+childWidth === rootWidth/2) index++;
                                target = Math.max(index - 1, 0);
                            }
                            return false;
                        }
                        offset += childWidth;
                    });
                } 

                if (!_.isNumber(target) && !_.is$(target))                       
                    target = $(target);

                $children.each(function(index) {
                    childWidth = $(this).outerWidth(true);
                    if (index === target || this === target[0]) {
                        to += rootWidth/2 - childWidth/2;
                        core._slideList($root, $list, from, to, {
                            easing: $root.data('options').showEasing,
                            callback: callback
                        });
                        return false;
                    }
                    to -= childWidth;
                });
            });
        },

        // Slides to a position or by an offset
        //  to: the position to slide to; if is prefixed with += or -=, the offset to slide by
        //  callback (optional): the callback to be invoked when sliding is completed
        //  Note: if options.msPer100px is 0, this call is synchronous
        //        and the callback is invoked immediately
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
        //  callback (optional): the callback to be invoked when refreshing is completed
        //  Note: if options.msPer100px is 0, this call is synchronous
        //        and the callback is invoked immediately
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
                if (rootHeight === 0) $root.height(maxItemHeight);

                $list.height($root.height() + 'px')
                     .width(Math.max(rootWidth, listWidth) + 'px');

                // Adjust 'left' if there's a gap at the end (i.e. due to removal)
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
     * Select an item when certain events occur on it. Selected items have 'selected' class.
     * ========================================================== */
    $.fn.yajc.plugins.selectOn = function(evts, center, callback) {
        return this.each(function() {
            var $root = $(this),
                center = center || true,
                callback = callback || $.noop;

            $root.find('li').live(evts,
                function(e) {
                    var self = this, $self = $(self);
                    $self.addClass('selected').siblings().removeClass('selected');
                    if (center) {
                        $root.yajc('show', $self, function() {
                            callback.call(self);
                        });
                    } else callback();
                }
            );
        });
    };


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
          
            //@TODO: support wipe/flick      
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
    };


    /* ===================================================
     * wings v0.0.1
     * ===================================================
     * Copyright 2012 Buu Nguyen
     *
     * Provides slide left and slide right wings.
     * ========================================================== */
    $.fn.yajc.plugins.wings = function(options) {
        return this.each(function() {
            var $root = $(this),
                $list = $root.find('.items'),
                $backwardWing = $('<a class="wing backward" href="javascript:void(0)"><p>‹</p></a>'),
                $forwardWing = $('<a class="wing forward" href="javascript:void(0)"><p>›</p></a>'),
                $bothWings = $backwardWing.add($forwardWing),
                isTouchDevice = _.isTouchDevice();
            
            options = $.extend({}, {
                style: 'pad',
                showOnHover: true, /* no effect for touch devices */
                snap: false /* if true, left wing shows prev, right wing next on tap/click */
            }, options);

            var slide = function(isForward) {
                if ($root.data('sliding')) {
                    if (options.snap) {
                        $root.yajc('show', isForward ? 'next' : 'prev');
                    } else {
                        $root.yajc('slide', '+=' + (isForward ? -10 : 10), function() {
                            slide(isForward);
                        });
                    }
                }
            };

            var on = function() {
                $root.data('sliding', true);
                if (options.snap) $root.yajc('stop');
                $(this).addClass('on');
                slide(this === $forwardWing[0]);
            };

            var off = function() {
                $root.data('sliding', false);
                if (!options.snap) $root.yajc('stop');
                $(this).removeClass('on');
            };

            $bothWings.addClass(options.style).appendTo($root.find('.yajc'));

            if (options.showOnHover && !isTouchDevice) {
                $bothWings.hide();
                $root.hover(
                    function() {
                        $bothWings.stop(true, true).fadeIn();
                    }, 
                    function() { 
                        $bothWings.stop(true, true).fadeOut();
                    }
                );
            }

            if (options.snap || isTouchDevice) 
                $bothWings.on(isTouchDevice ? 'touchstart' : 'mousedown',          on)
                          .on(isTouchDevice ? 'touchend'   : 'mouseup mouseout',   off);
            else $bothWings.hover(on, off);
        }); 
    };
})(jQuery);